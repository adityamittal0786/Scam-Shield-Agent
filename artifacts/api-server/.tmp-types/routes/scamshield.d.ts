/**
 * ScamShield API Routes
 *
 * This module wires the multi-agent orchestrator into the Express route layer.
 * Security checks (rate limiting, input validation) run BEFORE the orchestrator
 * is invoked, ensuring no agent ever receives malicious input.
 *
 * Route overview:
 *   POST /analyze      → Full multi-agent analysis pipeline
 *   POST /emergency    → Emergency recovery action plan
 *   GET  /history      → Recent analysis records
 *   DELETE /history/:id → Delete a record
 *   GET  /stats        → Aggregate statistics
 */
import { type IRouter } from "express";
declare const router: IRouter;
export default router;
