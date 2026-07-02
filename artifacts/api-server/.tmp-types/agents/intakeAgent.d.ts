/**
 * Intake Agent — ScamShield AI Multi-Agent System
 *
 * Role: First agent in the pipeline. Classifies input type and extracts
 *       structural metadata WITHOUT making an AI call (fast, deterministic).
 *
 * Responsibilities:
 * - Detect input medium (SMS, Email, URL, Job listing, QR content, Social DM, etc.)
 * - Extract embedded URLs
 * - Detect mentioned brand names that may be impersonated
 * - Provide structured metadata for downstream agents
 *
 * This agent runs synchronously and completes in <1ms.
 */
export interface IntakeResult {
    inputType: InputType;
    extractedUrls: string[];
    detectedBrands: string[];
    containsPhoneNumbers: boolean;
    containsMoneyAmounts: boolean;
    characterCount: number;
}
export type InputType = "URL" | "SMS" | "Email" | "Job Listing" | "QR Code Content" | "Social Media DM" | "Phone Call Script" | "General Text";
/**
 * Runs the Intake Agent on the provided input.
 * Returns structured metadata for downstream agents.
 */
export declare function runIntakeAgent(input: string): IntakeResult;
