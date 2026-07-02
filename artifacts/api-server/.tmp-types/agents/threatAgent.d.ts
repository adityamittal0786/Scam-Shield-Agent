/**
 * Threat Analysis Agent — ScamShield AI Multi-Agent System
 *
 * Role: Core analysis agent. Identifies scam type, psychological tactics,
 *       risk level, and generates confidence-scored threat assessment.
 *
 * Responsibilities:
 * - Classify scam category (Phishing, Job Scam, OTP Fraud, etc.)
 * - Detect psychological manipulation triggers
 * - Score confidence and risk level
 * - Extract specific red flags with evidence
 * - Assess AI-generated content likelihood
 *
 * This agent uses Gemini 2.5 Flash with a focused, scoped prompt.
 */
export interface ThreatResult {
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
}
/**
 * Runs the Threat Analysis Agent.
 * Accepts the raw content and intake metadata to produce a focused threat report.
 */
export declare function runThreatAgent(content: string, inputType: string, detectedBrands: string[]): Promise<ThreatResult>;
