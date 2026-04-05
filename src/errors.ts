export enum ErrorCode {
  RATE_LIMITED = "RATE_LIMITED",
  AI_UNAVAILABLE = "AI_UNAVAILABLE",
  AUTH_FAILED = "AUTH_FAILED",
  API_ERROR = "API_ERROR",
}

export class InsightsError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
  ) {
    super(message);
    this.name = "InsightsError";
  }
}

/** Process exit codes by error type. */
export const EXIT_CODES: Record<ErrorCode | "UNKNOWN", number> = {
  [ErrorCode.RATE_LIMITED]: 2,
  [ErrorCode.AI_UNAVAILABLE]: 3,
  [ErrorCode.AUTH_FAILED]: 4,
  [ErrorCode.API_ERROR]: 5,
  UNKNOWN: 1,
};

export function getExitCode(error: unknown): number {
  if (error instanceof InsightsError) {
    return EXIT_CODES[error.code];
  }
  return EXIT_CODES.UNKNOWN;
}
