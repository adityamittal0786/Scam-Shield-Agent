/**
 * Education Agent — ScamShield AI Multi-Agent System
 *
 * Role: Generates beginner-friendly educational content based on the threat
 *       assessment produced by the Threat Analysis Agent.
 *
 * Responsibilities:
 * - Produce an ELI15 (Explain Like I'm 15) plain-English summary
 * - Generate specific, actionable prevention tips
 * - Provide concrete recommended actions for the user
 *
 * This agent runs after the Threat Agent and uses its output.
 * It uses Gemini 2.5 Flash with an education-focused prompt.
 */
import type { ThreatResult } from "./threatAgent.js";
export interface EducationResult {
    eli15: string;
    preventionTips: string[];
    recommendedActions: string[];
}
/**
 * Runs the Education Agent.
 * Translates technical threat analysis into accessible, actionable guidance.
 */
export declare function runEducationAgent(content: string, threat: ThreatResult): Promise<EducationResult>;
