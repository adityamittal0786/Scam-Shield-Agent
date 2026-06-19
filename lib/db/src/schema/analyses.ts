import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  contentSnippet: text("content_snippet").notNull(),
  riskLevel: text("risk_level").notNull(),
  scamType: text("scam_type").notNull(),
  confidenceScore: real("confidence_score").notNull(),
  fullResult: text("full_result").notNull(),
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({ id: true, analyzedAt: true });
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
