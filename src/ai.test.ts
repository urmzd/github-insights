import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import {
  buildChatBody,
  DEFAULT_AI_BASE_URL,
  DEFAULT_AI_MODEL,
  isAIDisabled,
  probeAIEndpoint,
  requestChatJSON,
  resolveAIEndpoint,
  supportsTemperature,
} from "./ai.js";
import { resolvePrompts } from "./prompts.js";

const baseReq = {
  model: "qwen3.5:4b",
  temperature: 0.2,
  system: "sys",
  user: "usr",
  schemaName: "x",
  schema: { type: "object" },
};

describe("resolveAIEndpoint", () => {
  it("defaults the model and drops empty keys", () => {
    const ep = resolveAIEndpoint({ baseUrl: DEFAULT_AI_BASE_URL, apiKey: "" });
    expect(ep).toEqual({
      baseUrl: DEFAULT_AI_BASE_URL,
      model: DEFAULT_AI_MODEL,
      apiKey: undefined,
      reasoningEffort: "none",
    });
  });

  it("omits reasoning effort when explicitly empty", () => {
    expect(
      resolveAIEndpoint({ baseUrl: "x", reasoningEffort: "" }).reasoningEffort,
    ).toBeUndefined();
  });

  it("treats empty or 'none' base URL as disabled", () => {
    expect(isAIDisabled(resolveAIEndpoint({ baseUrl: "" }))).toBe(true);
    expect(isAIDisabled(resolveAIEndpoint({ baseUrl: "none" }))).toBe(true);
    expect(
      isAIDisabled(resolveAIEndpoint({ baseUrl: DEFAULT_AI_BASE_URL })),
    ).toBe(false);
  });
});

describe("supportsTemperature", () => {
  it("allows temperature for non gpt-6 models", () => {
    expect(supportsTemperature("qwen3.5:4b")).toBe(true);
    expect(supportsTemperature("gpt-4.1")).toBe(true);
  });

  it("omits temperature for gpt-6 unless reasoning effort is none", () => {
    expect(supportsTemperature("gpt-6-luna")).toBe(false);
    expect(supportsTemperature("openai/gpt-6")).toBe(false);
    expect(supportsTemperature("gpt-6-luna", "low")).toBe(false);
    expect(supportsTemperature("gpt-6-luna", "none")).toBe(true);
  });
});

describe("buildChatBody", () => {
  it("sends temperature and strict json_schema for local models", () => {
    const body = buildChatBody(baseReq);
    expect(body.temperature).toBe(0.2);
    expect(body.reasoning_effort).toBeUndefined();
    expect(body.response_format).toEqual({
      type: "json_schema",
      json_schema: { name: "x", strict: true, schema: { type: "object" } },
    });
  });

  it("drops temperature for gpt-6 models", () => {
    const body = buildChatBody({ ...baseReq, model: "gpt-6-luna" });
    expect("temperature" in body).toBe(false);
  });

  it("keeps temperature for gpt-6 with reasoning effort none", () => {
    const body = buildChatBody({
      ...baseReq,
      model: "gpt-6-luna",
      reasoningEffort: "none",
    });
    expect(body.temperature).toBe(0.2);
    expect(body.reasoning_effort).toBe("none");
  });
});

describe("resolvePrompts", () => {
  it("uses the endpoint model unless a task overrides it", () => {
    const p = resolvePrompts(
      {
        preamble: { model: "custom", reasoning_effort: "high" },
        classification: {},
      },
      { model: "m1", reasoningEffort: "none" },
    );
    expect(p.preamble.reasoning_effort).toBe("high");
    expect(p.classification.reasoning_effort).toBe("none");
    expect(p.preamble.model).toBe("custom");
    expect(p.classification.model).toBe("m1");
  });
});

const withServer = async (
  handler: Parameters<typeof createServer>[1],
  fn: (baseUrl: string) => Promise<void>,
) => {
  const server = createServer(handler);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address() as AddressInfo;
  try {
    await fn(`http://127.0.0.1:${port}/v1`);
  } finally {
    server.close();
  }
};

describe("requestChatJSON", () => {
  it("posts to chat/completions with bearer key and parses JSON content", async () => {
    let seen: { url?: string; auth?: string; body?: string } = {};
    await withServer(
      (req, res) => {
        let body = "";
        req.on("data", (c) => {
          body += c;
        });
        req.on("end", () => {
          seen = { url: req.url, auth: req.headers.authorization, body };
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              choices: [{ message: { content: '```json\n{"ok":true}\n```' } }],
            }),
          );
        });
      },
      async (baseUrl) => {
        const out = await requestChatJSON<{ ok: boolean }>(
          { baseUrl: `${baseUrl}/`, model: "m", apiKey: "k" },
          baseReq,
          "test",
        );
        expect(out).toEqual({ ok: true });
      },
    );
    expect(seen.url).toBe("/v1/chat/completions");
    expect(seen.auth).toBe("Bearer k");
    expect(JSON.parse(seen.body ?? "{}").model).toBe("qwen3.5:4b");
  });

  it("sends no Authorization header without a key", async () => {
    let auth: string | undefined = "unset";
    await withServer(
      (req, res) => {
        auth = req.headers.authorization;
        res.end(JSON.stringify({ choices: [{ message: { content: "{}" } }] }));
      },
      async (baseUrl) => {
        await requestChatJSON({ baseUrl, model: "m" }, baseReq, "test");
      },
    );
    expect(auth).toBeUndefined();
  });
});

describe("requestChatJSON empty content", () => {
  it("throws AI_UNAVAILABLE on empty content", async () => {
    await withServer(
      (_req, res) => {
        res.end(JSON.stringify({ choices: [{ message: { content: "" } }] }));
      },
      async (baseUrl) => {
        await expect(
          requestChatJSON({ baseUrl, model: "m" }, baseReq, "test"),
        ).rejects.toMatchObject({ code: "AI_UNAVAILABLE" });
      },
    );
  });
});

describe("probeAIEndpoint", () => {
  it("reports an unreachable endpoint", async () => {
    const reason = await probeAIEndpoint(
      { baseUrl: "http://127.0.0.1:1/v1", model: "m" },
      2000,
    );
    expect(reason).toMatch(/unreachable/);
  });

  it("treats any HTTP response as reachable", async () => {
    await withServer(
      (_req, res) => {
        res.statusCode = 401;
        res.end();
      },
      async (baseUrl) => {
        expect(await probeAIEndpoint({ baseUrl, model: "m" })).toBeUndefined();
      },
    );
  });
});
