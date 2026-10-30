/**
 * Application error reporting utility for React error boundaries and global exception handlers.
 * Captures caught boundary errors, formats human-readable diagnostics, and logs them.
 * Can be hooked into Sentry, LogRocket, or any custom telemetry pipeline when configured.
 */

export interface ErrorReportContext {
  boundary?: string;
  route?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Report an error caught by a React error boundary or async handler.
 */
export function reportAppError(error: unknown, context: ErrorReportContext = {}): void {
  if (typeof window === "undefined") return;

  const summary = describeThrown(error);
  console.error(`[App Error Boundary: ${context.boundary ?? "global"}]`, summary, {
    ...context,
    timestamp: new Date().toISOString(),
    rawError: error,
  });
}

const MAX_SERIALIZED_LENGTH = 2000;

/**
 * Produces a clear, human-readable one-line description of any thrown value.
 */
function describeThrown(error: unknown): string {
  if (error instanceof Response) {
    return `HTTP Response ${error.status}${error.url ? ` at ${error.url}` : ""}`;
  }
  if (error instanceof Error) {
    return error.stack || `${error.name}: ${error.message}`;
  }
  if (typeof error === "string") {
    return error;
  }

  const { message } = (error ?? {}) as { message?: unknown };
  if (typeof message === "string" && message.length > 0) {
    return message;
  }

  try {
    return JSON.stringify(error)?.slice(0, MAX_SERIALIZED_LENGTH) ?? String(error);
  } catch {
    return String(error);
  }
}
