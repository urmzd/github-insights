import { Box, Text, useApp } from "ink";
import Spinner from "ink-spinner";
import React, { useEffect, useState } from "react";
import type {
  PipelineCallbacks,
  PipelineConfig,
  PipelinePhase,
} from "../pipeline.js";
import { runPipeline } from "../pipeline.js";

interface PhaseState {
  phase: PipelinePhase;
  label: string;
  status: "pending" | "active" | "done" | "error";
  summary?: string;
  startedAt?: number;
  elapsed?: number;
}

const PHASE_ORDER: PipelinePhase[] = [
  "fetch-repos",
  "fetch-profile",
  "classify",
  "transform",
  "render-svg",
  "write-files",
  "generate-readme",
  "commit-push",
];

const PHASE_LABELS: Record<PipelinePhase, string> = {
  "fetch-repos": "Fetch repositories",
  "fetch-profile": "Fetch contributions & profile",
  classify: "Classify projects (AI)",
  transform: "Compute metrics",
  "render-svg": "Render SVGs",
  "write-files": "Write output files",
  "generate-readme": "Generate README",
  "commit-push": "Commit & push",
};

function PhaseRow({ state }: { state: PhaseState }) {
  const elapsed =
    state.elapsed != null ? ` ${(state.elapsed / 1000).toFixed(1)}s` : "";

  if (state.status === "active") {
    return (
      <Box>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text> {state.label}</Text>
        <Text dimColor>{elapsed}</Text>
      </Box>
    );
  }

  if (state.status === "done") {
    return (
      <Box>
        <Text color="green">✔</Text>
        <Text> {state.label}</Text>
        <Text dimColor>
          {" "}
          — {state.summary}
          {elapsed}
        </Text>
      </Box>
    );
  }

  if (state.status === "error") {
    return (
      <Box>
        <Text color="red">✘</Text>
        <Text> {state.label}</Text>
        <Text color="red"> — {state.summary}</Text>
      </Box>
    );
  }

  // pending
  return (
    <Box>
      <Text dimColor>○ {state.label}</Text>
    </Box>
  );
}

function Header({ username }: { username: string }) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="magenta">
        ◆ GitHub Insights
      </Text>
      <Text dimColor> Generating metrics for {username}</Text>
    </Box>
  );
}

function ProgressLog({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <Box flexDirection="column" marginTop={1}>
      {messages.slice(-3).map((msg) => (
        <Text key={msg} dimColor>
          │ {msg}
        </Text>
      ))}
    </Box>
  );
}

export interface AppProps {
  config: PipelineConfig;
  onExit?: (error: unknown | null) => void;
}

export function App({ config, onExit }: AppProps) {
  const { exit } = useApp();
  const [phases, setPhases] = useState<PhaseState[]>(
    PHASE_ORDER.map((p) => ({
      phase: p,
      label: PHASE_LABELS[p],
      status: "pending" as const,
    })),
  );
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipelineError, setPipelineError] = useState<unknown>(null);
  const [startTime] = useState(Date.now());
  const [totalElapsed, setTotalElapsed] = useState(0);

  useEffect(() => {
    const callbacks: PipelineCallbacks = {
      onPhaseStart(phase, label) {
        setPhases((prev) =>
          prev.map((p) =>
            p.phase === phase
              ? {
                  ...p,
                  status: "active" as const,
                  label,
                  startedAt: Date.now(),
                }
              : p,
          ),
        );
      },
      onPhaseComplete(phase, summary) {
        setPhases((prev) =>
          prev.map((p) =>
            p.phase === phase
              ? {
                  ...p,
                  status: "done" as const,
                  summary,
                  elapsed: p.startedAt ? Date.now() - p.startedAt : undefined,
                }
              : p,
          ),
        );
      },
      onProgress(message) {
        setProgressMessages((prev) => [...prev, message]);
      },
      onError(err) {
        setError(err.message);
      },
    };

    runPipeline(config, callbacks)
      .then(() => {
        setTotalElapsed(Date.now() - startTime);
        setDone(true);
      })
      .catch((err) => {
        setTotalElapsed(Date.now() - startTime);
        setPipelineError(err);
        setError(err instanceof Error ? err.message : String(err));
        setDone(true);
      });
  }, [config, startTime]);

  useEffect(() => {
    if (done) {
      onExit?.(pipelineError);
      setTimeout(() => exit(), 100);
    }
  }, [done, exit, onExit, pipelineError]);

  // Filter out phases that were never activated and are still pending at the end
  const visiblePhases = done
    ? phases.filter((p) => p.status !== "pending")
    : phases;

  return (
    <Box flexDirection="column" paddingX={1}>
      <Header username={config.username} />

      <Box flexDirection="column">
        {visiblePhases.map((p) => (
          <PhaseRow key={p.phase} state={p} />
        ))}
      </Box>

      <ProgressLog messages={progressMessages} />

      {done && !error && (
        <Box marginTop={1}>
          <Text color="green" bold>
            ✔ Done
          </Text>
          <Text dimColor> in {(totalElapsed / 1000).toFixed(1)}s</Text>
        </Box>
      )}

      {error && (
        <Box marginTop={1} flexDirection="column">
          <Text color="red" bold>
            ✘ Failed
          </Text>
          <Text color="red">{error}</Text>
        </Box>
      )}
    </Box>
  );
}
