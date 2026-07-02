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
 * Runs `fn` with exponential backoff retry on transient errors.
 *
 * @param fn - Async function to execute
 * @param options - maxAttempts (default 3), baseDelayMs (default 2000), maxDelayMs (default 30000)
 */
export declare function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
export {};
