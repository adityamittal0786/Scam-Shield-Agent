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
/**
 * Detects whether the input contains prompt injection attempts.
 * Returns true if injection is detected (input should be rejected).
 */
export declare function detectPromptInjection(input: string): boolean;
/**
 * Sanitizes user input before passing to the agent pipeline:
 * - Trims whitespace
 * - Removes null bytes (common in injection attempts)
 * - Enforces maximum length
 * - Normalizes excessive whitespace
 */
export declare function sanitizeInput(input: string): string;
/**
 * Validates that the input is non-empty after sanitization.
 */
export declare function validateInput(input: string): {
    valid: boolean;
    reason?: string;
};
/**
 * Checks whether the given IP has exceeded the rate limit.
 * Returns { allowed: true } if the request is within limits.
 */
export declare function checkRateLimit(ip: string): {
    allowed: boolean;
    retryAfterMs?: number;
};
/**
 * Returns a safe, non-revealing error response when the agent pipeline fails.
 * Avoids leaking internal implementation details.
 */
export declare function safeFallbackResponse(context: string): {
    error: string;
    context: string;
};
