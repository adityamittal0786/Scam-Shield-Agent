/**
 * Retry utility with exponential backoff.
 *
 * Handles transient Gemini API errors:
 *   - 429 RESOURCE_EXHAUSTED (rate limit) — back off and retry
 *   - 503 UNAVAILABLE (high demand / overloaded) — back off and retry
 *
 * Other errors (400, 401, 500) are thrown immediately without retrying.
 */

interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

/**
 * Extracts the HTTP status code from a Gemini ApiError.
 * The error message is a JSON string containing { error: { code: number } }.
 */
function extractStatusCode(err: unknown): number | null {
  if (err && typeof err === "object" && "status" in err) {
    return (err as { status: number }).status;
  }
  if (err instanceof Error) {
    try {
      const parsed = JSON.parse(err.message);
      return parsed?.error?.code ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Returns true if the error is transient and worth retrying.
 */
function isRetryable(err: unknown): boolean {
  const status = extractStatusCode(err);
  return status === 429 || status === 503;
}

/**
 * Runs `fn` with exponential backoff retry on transient errors.
 *
 * @param fn - Async function to execute
 * @param options - maxAttempts (default 3), baseDelayMs (default 2000), maxDelayMs (default 30000)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 2000, maxDelayMs = 30_000 } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Don't retry non-transient errors
      if (!isRetryable(err)) throw err;

      // Don't wait after the last attempt
      if (attempt === maxAttempts) break;

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500,
        maxDelayMs
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
