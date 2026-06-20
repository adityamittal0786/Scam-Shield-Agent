/**
 * Security Module — ScamShield AI Agent
 *
 * Implements defensive security features required for production AI agents:
 * - Prompt injection detection
 * - Input sanitization
 * - In-memory rate limiting
 * - Safe fallback responses
 *
 * These features protect the agent pipeline from adversarial inputs and abuse.
 */

// ─── Prompt Injection Patterns ────────────────────────────────────────────────
// Known prompt injection phrases that attempt to hijack the agent's behavior.
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  /forget\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  /you\s+are\s+now\s+(a\s+)?(different|new|another)/i,
  /system\s*prompt/i,
  /\[system\]/i,
  /<\s*system\s*>/i,
  /act\s+as\s+(if\s+you\s+are|a)\s+/i,
  /jailbreak/i,
  /dan\s+mode/i,
  /override\s+(the\s+)?(system|agent|ai)/i,
  /reveal\s+(your\s+)?(system|hidden|secret)\s+prompt/i,
];

/**
 * Detects whether the input contains prompt injection attempts.
 * Returns true if injection is detected (input should be rejected).
 */
export function detectPromptInjection(input: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

// ─── Input Sanitization ───────────────────────────────────────────────────────
const MAX_INPUT_LENGTH = 5000;

/**
 * Sanitizes user input before passing to the agent pipeline:
 * - Trims whitespace
 * - Removes null bytes (common in injection attempts)
 * - Enforces maximum length
 * - Normalizes excessive whitespace
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/\0/g, "") // strip null bytes
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // strip zero-width chars
    .slice(0, MAX_INPUT_LENGTH);
}

/**
 * Validates that the input is non-empty after sanitization.
 */
export function validateInput(input: string): { valid: boolean; reason?: string } {
  const sanitized = sanitizeInput(input);

  if (!sanitized || sanitized.length < 3) {
    return { valid: false, reason: "Input is too short to analyze." };
  }

  if (detectPromptInjection(sanitized)) {
    return {
      valid: false,
      reason: "Input contains patterns that cannot be processed for security reasons.",
    };
  }

  return { valid: true };
}

// ─── In-Memory Rate Limiter ───────────────────────────────────────────────────
// Tracks request counts per IP over a rolling time window.
// In production, replace with Redis-backed rate limiting (e.g. @upstash/ratelimit).

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 analyses per minute per IP

/**
 * Checks whether the given IP has exceeded the rate limit.
 * Returns { allowed: true } if the request is within limits.
 */
export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // Start a new window
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }

  entry.count += 1;
  return { allowed: true };
}

// Clean up stale rate limit entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60_000);

// ─── Safe Fallback ────────────────────────────────────────────────────────────
/**
 * Returns a safe, non-revealing error response when the agent pipeline fails.
 * Avoids leaking internal implementation details.
 */
export function safeFallbackResponse(context: string) {
  return {
    error: "The analysis could not be completed at this time. Please try again.",
    context,
  };
}
