import { ErrorCode, InsightsError } from "./errors.js";

// ── Endpoint config ────────────────────────────────────────────────────────

/** Ollama's OpenAI-compatible API on its default port. */
export const DEFAULT_AI_BASE_URL = "http://localhost:11434/v1";

/** Small local model; any model pulled into Ollama (or served by the endpoint) works. */
export const DEFAULT_AI_MODEL = "qwen3.5:4b";

/**
 * Small local thinking models spend their context on reasoning and can return
 * empty content under structured output, so thinking is off by default.
 */
export const DEFAULT_AI_REASONING_EFFORT = "none";

/** An OpenAI-compatible Chat Completions endpoint. */
export interface AIEndpoint {
  /** Base URL such as `http://localhost:11434/v1`. Empty or `none` disables AI. */
  baseUrl: string;
  /** Default model for every AI task. Per-task `ai.*.model` in the config file wins. */
  model: string;
  /** Bearer token. Ollama needs none; hosted providers do. */
  apiKey?: string;
  /** Default `reasoning_effort` for every task. Undefined omits the parameter. */
  reasoningEffort?: string;
}

/**
 * Normalize raw settings. An unset reasoning effort falls back to the default;
 * an explicit empty string omits the parameter for models that reject it.
 */
export const resolveAIEndpoint = (opts: {
  baseUrl?: string;
  model?: string;
  apiKey?: string;
  reasoningEffort?: string;
}): AIEndpoint => ({
  baseUrl: (opts.baseUrl ?? "").trim(),
  model: opts.model?.trim() || DEFAULT_AI_MODEL,
  apiKey: opts.apiKey?.trim() || undefined,
  reasoningEffort:
    opts.reasoningEffort === undefined
      ? DEFAULT_AI_REASONING_EFFORT
      : opts.reasoningEffort.trim() || undefined,
});

export const isAIDisabled = (endpoint: AIEndpoint): boolean => {
  const url = endpoint.baseUrl.trim().toLowerCase();
  return url === "" || url === "none" || url === "off";
};

const joinUrl = (baseUrl: string, path: string): string =>
  `${baseUrl.replace(/\/+$/, "")}/${path}`;

const authHeaders = (endpoint: AIEndpoint): Record<string, string> =>
  endpoint.apiKey ? { Authorization: `Bearer ${endpoint.apiKey}` } : {};

// ── Reachability ───────────────────────────────────────────────────────────

/**
 * Check that something answers at the endpoint. Any HTTP response counts as
 * reachable (auth and model errors surface on the real call). Returns a
 * human-readable reason when the endpoint is unreachable, otherwise undefined.
 */
export const probeAIEndpoint = async (
  endpoint: AIEndpoint,
  timeoutMs = 5000,
): Promise<string | undefined> => {
  try {
    await fetch(joinUrl(endpoint.baseUrl, "models"), {
      headers: authHeaders(endpoint),
      signal: AbortSignal.timeout(timeoutMs),
    });
    return undefined;
  } catch (err) {
    return `${endpoint.baseUrl} is unreachable (${describeFetchError(err)})`;
  }
};

/** Prefer the socket error code (ECONNREFUSED, ENOTFOUND) over "fetch failed". */
const describeFetchError = (err: unknown): string => {
  if (!(err instanceof Error)) return String(err);
  const cause = err.cause as { code?: string; message?: string } | undefined;
  return cause?.code || cause?.message || err.message || err.name;
};

// ── Request shape ──────────────────────────────────────────────────────────

/**
 * GPT-6 family models reject `temperature` unless reasoning effort is `none`.
 * Matches bare and publisher-prefixed names (`gpt-6-luna`, `openai/gpt-6`).
 */
export const supportsTemperature = (
  model: string,
  reasoningEffort?: string,
): boolean => {
  const name = (model.split("/").pop() ?? "").toLowerCase();
  if (!name.startsWith("gpt-6")) return true;
  return reasoningEffort === "none";
};

export interface ChatJSONRequest {
  model: string;
  temperature: number;
  reasoningEffort?: string;
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
}

/** Standard Chat Completions body with strict JSON-schema structured output. */
export const buildChatBody = (
  req: ChatJSONRequest,
): Record<string, unknown> => {
  const body: Record<string, unknown> = {
    model: req.model,
    messages: [
      { role: "system", content: req.system },
      { role: "user", content: req.user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: req.schemaName, strict: true, schema: req.schema },
    },
  };
  if (req.reasoningEffort) body.reasoning_effort = req.reasoningEffort;
  if (supportsTemperature(req.model, req.reasoningEffort)) {
    body.temperature = req.temperature;
  }
  return body;
};

// ── Transport ──────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;

const fetchWithRetry = async (
  url: string,
  init: RequestInit,
  label: string,
): Promise<Response> => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (err) {
      throw new InsightsError(
        `${label}: network error: ${err instanceof Error ? err.message : String(err)}`,
        ErrorCode.AI_UNAVAILABLE,
      );
    }
    if (res.status !== 429) return res;

    if (attempt === MAX_RETRIES) {
      throw new InsightsError(
        `${label}: rate limited after ${MAX_RETRIES + 1} attempts`,
        ErrorCode.RATE_LIMITED,
      );
    }

    const retryAfter = res.headers.get("retry-after");
    const waitSec = retryAfter ? Math.min(Number(retryAfter) || 10, 60) : 10;
    console.warn(
      `${label}: rate limited, retrying in ${waitSec}s (attempt ${attempt + 1}/${MAX_RETRIES})`,
    );
    await new Promise((r) => setTimeout(r, waitSec * 1000));
  }
  /* istanbul ignore next — unreachable, loop always returns or throws */
  throw new InsightsError(`${label}: rate limited`, ErrorCode.RATE_LIMITED);
};

/** Some models wrap JSON in markdown fences even under structured output. */
const stripFences = (content: string): string =>
  content
    .trim()
    .replace(/^```(?:json)?\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();

/** POST a Chat Completions request and parse the message content as JSON. */
export const requestChatJSON = async <T>(
  endpoint: AIEndpoint,
  req: ChatJSONRequest,
  label: string,
): Promise<T> => {
  const res = await fetchWithRetry(
    joinUrl(endpoint.baseUrl, "chat/completions"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(endpoint) },
      body: JSON.stringify(buildChatBody(req)),
    },
    label,
  );

  if (res.status === 401 || res.status === 403) {
    throw new InsightsError(
      `AI endpoint auth error (${label}): ${res.status}`,
      ErrorCode.AUTH_FAILED,
    );
  }

  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 200);
    throw new InsightsError(
      `AI endpoint error (${label}): ${res.status}${detail ? ` ${detail}` : ""}`,
      ErrorCode.AI_UNAVAILABLE,
    );
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new InsightsError(
      `AI endpoint returned empty content (${label})`,
      ErrorCode.AI_UNAVAILABLE,
    );
  }
  try {
    return JSON.parse(stripFences(content)) as T;
  } catch {
    throw new InsightsError(
      `AI endpoint returned invalid JSON (${label})`,
      ErrorCode.AI_UNAVAILABLE,
    );
  }
};
