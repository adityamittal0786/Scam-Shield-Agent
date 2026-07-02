/**
 * Orchestrator Agent — ScamShield AI Multi-Agent System
 *
 * Role: Coordinates the entire multi-agent pipeline. Manages agent execution
 *       order, batches AI calls intelligently, and assembles the final response.
 *
 * Pipeline Architecture:
 *
 *   ┌─────────────────────────────────────────────┐
 *   │              ORCHESTRATOR                   │
 *   │                                             │
 *   │  1. Intake Agent (sync, rule-based)         │
 *   │            │                                │
 *   │            ▼                                │
 *   │  2. Comprehensive Analysis Agent            │
 *   │     (batches: Threat + Education +          │
 *   │      Vulnerability + Attack Chain +         │
 *   │      AI Likelihood — single AI call)        │
 *   │            │                                │
 *   │            ▼                                │
 *   │  3. URL Intelligence Agent                  │
 *   │     (separate call, only if URL found)      │
 *   │            │                                │
 *   │  4. Reporting Agent (sync, rule-based)      │
 *   │            │                                │
 *   │            ▼                                │
 *   │     Assemble & Return                       │
 *   └─────────────────────────────────────────────┘
 *
 * Design Note:
 *   Each agent module defines its own focused prompt and output schema — they
 *   are independently testable and replaceable. The orchestrator batches AI calls
 *   for efficiency (avoid rate limits on free tier), which is a common production
 *   optimization for multi-agent systems.
 */
export interface OrchestratorResult {
    inputType: string;
    extractedUrls: string[];
    type: string;
    riskLevel: "Low" | "Medium" | "High" | "Critical";
    confidenceScore: number;
    reasoning: string[];
    educationMode: {
        techniques: Array<{
            name: string;
            detected: boolean;
            explanation: string;
        }>;
        whyThisMatters: string;
    };
    aiGeneratedLikelihood: {
        likelihood: "Low" | "Moderate" | "High";
        reasons: string[];
        disclaimer: string;
    };
    eli15: string;
    preventionTips: string[];
    recommendedActions: string[];
    vulnerableGroups: string[];
    scammerStrategy: string[];
    urlIntelligence?: {
        isUrl: boolean;
        domain: string;
        threatScore: number;
        possibleTyposquatting: boolean;
        typosquattingTarget: string;
        usesUrlShortener: boolean;
        suspiciousKeywords: string[];
        recommendation: string;
    };
    domainComparison?: {
        detected: boolean;
        submittedDomain: string;
        officialDomain: string;
        isOfficial: boolean;
        brand: string;
    };
    reportingLinks: Array<{
        platform: string;
        url: string;
        description: string;
    }>;
}
/**
 * Runs the full ScamShield multi-agent pipeline.
 * @param rawInput — Raw user-provided content to analyze
 * @returns Assembled analysis result from all agents
 */
export declare function runOrchestrator(rawInput: string): Promise<OrchestratorResult>;
