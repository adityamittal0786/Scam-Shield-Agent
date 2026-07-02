/**
 * URL Intelligence Agent — ScamShield AI Multi-Agent System
 *
 * Role: Specialized agent for analyzing URLs and domains found in scam content.
 *       Runs in parallel with the Threat Analysis Agent when URLs are present.
 *
 * Responsibilities:
 * - Detect typosquatting (e.g. amaz0n, paypa1, sbi-verify.net)
 * - Identify URL shorteners that hide malicious destinations
 * - Find suspicious keywords in URL paths and parameters
 * - Score URL threat level independently
 * - Compare against known official domains for brand impersonation
 * - Generate domain comparison report
 *
 * This agent uses Gemini 2.5 Flash with a URL-specific prompt.
 */
export interface UrlIntelligenceResult {
    isUrl: boolean;
    domain: string;
    threatScore: number;
    possibleTyposquatting: boolean;
    typosquattingTarget: string;
    usesUrlShortener: boolean;
    suspiciousKeywords: string[];
    recommendation: string;
}
export interface DomainComparisonResult {
    detected: boolean;
    submittedDomain: string;
    officialDomain: string;
    isOfficial: boolean;
    brand: string;
}
export interface UrlAgentResult {
    urlIntelligence: UrlIntelligenceResult;
    domainComparison: DomainComparisonResult;
}
/**
 * Runs the URL Intelligence Agent on the first detected URL.
 * Returns null if no URL is present in the content.
 */
export declare function runUrlAgent(content: string, extractedUrls: string[]): Promise<UrlAgentResult | null>;
