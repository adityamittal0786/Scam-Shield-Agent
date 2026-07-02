/**
 * Reporting Agent — ScamShield AI Multi-Agent System
 *
 * Role: Generates context-aware reporting links and actions based on the
 *       specific scam type detected by the Threat Analysis Agent.
 *
 * Responsibilities:
 * - Match scam type to relevant Indian and international reporting authorities
 * - Provide direct, actionable report URLs
 * - Suggest platform-specific reporting (LinkedIn for job scams, etc.)
 *
 * This agent is deterministic (no AI call) — it uses a rule-based mapping
 * for speed and reliability. Reporting links don't require AI inference.
 */
export interface ReportingLink {
    platform: string;
    url: string;
    description: string;
}
/**
 * Runs the Reporting Agent.
 * Returns contextual reporting links based on scam type. No AI call needed.
 */
export declare function runReportingAgent(scamType: string): ReportingLink[];
