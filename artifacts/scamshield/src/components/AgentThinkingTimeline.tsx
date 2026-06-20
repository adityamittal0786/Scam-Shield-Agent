/**
 * AgentThinkingTimeline — ScamShield Frontend
 *
 * Visual representation of the multi-agent pipeline executing in real time.
 * Each agent step appears sequentially with a short delay to mirror actual
 * pipeline execution order:
 *   Intake → Threat + URL (parallel) → Education + Vulnerability → Assemble
 *
 * This component demonstrates the multi-agent architecture to users and judges.
 */

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface AgentStep {
  id: string;
  agent: string;
  description: string;
  delayMs: number;
  parallel?: string;
}

const AGENT_STEPS: AgentStep[] = [
  {
    id: "intake",
    agent: "Intake Agent",
    description: "Classifying input type and extracting entities...",
    delayMs: 0,
  },
  {
    id: "threat",
    agent: "Threat Analysis Agent",
    description: "Scanning for scam patterns and psychological tactics...",
    delayMs: 600,
    parallel: "url",
  },
  {
    id: "url",
    agent: "URL Intelligence Agent",
    description: "Analyzing domain and checking for typosquatting...",
    delayMs: 600,
    parallel: "threat",
  },
  {
    id: "education",
    agent: "Education Agent",
    description: "Generating plain-language explanation and safety tips...",
    delayMs: 2800,
  },
  {
    id: "vulnerability",
    agent: "Vulnerability Agent",
    description: "Identifying at-risk groups and mapping attack chain...",
    delayMs: 3200,
  },
  {
    id: "reporting",
    agent: "Reporting Agent",
    description: "Selecting relevant authorities to report this scam...",
    delayMs: 3600,
  },
  {
    id: "orchestrator",
    agent: "Orchestrator",
    description: "Assembling final threat report...",
    delayMs: 4200,
  },
];

type StepStatus = "waiting" | "running" | "done";

export function AgentThinkingTimeline() {
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>(
    Object.fromEntries(AGENT_STEPS.map((s) => [s.id, "waiting"]))
  );

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    AGENT_STEPS.forEach((step) => {
      // Start step after delay
      timers.push(
        setTimeout(() => {
          setStepStatuses((prev) => ({ ...prev, [step.id]: "running" }));
        }, step.delayMs)
      );

      // Mark done 900ms after starting (simulate work)
      timers.push(
        setTimeout(() => {
          setStepStatuses((prev) => ({ ...prev, [step.id]: "done" }));
        }, step.delayMs + 900)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-mono font-bold tracking-tight text-foreground uppercase">
          Agent Pipeline Running
        </h3>
        <p className="text-sm text-muted-foreground font-mono">
          Multi-agent system analyzing your content
        </p>
      </div>

      <div className="space-y-1">
        {AGENT_STEPS.map((step, idx) => {
          const status = stepStatuses[step.id];
          const isParallel = step.parallel && idx > 0 && AGENT_STEPS[idx - 1].parallel === step.id;

          return (
            <div key={step.id}>
              {/* Parallel indicator */}
              {isParallel && (
                <div className="flex items-center gap-2 ml-6 -mt-1 mb-1">
                  <div className="w-px h-3 bg-border ml-3" />
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    ↳ parallel
                  </span>
                </div>
              )}

              <div
                className={`flex items-start gap-4 p-3 rounded-lg transition-all duration-300 ${
                  status === "running"
                    ? "bg-primary/10 border border-primary/20"
                    : status === "done"
                    ? "bg-emerald-500/5 border border-emerald-500/10"
                    : "border border-transparent opacity-40"
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {status === "done" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : status === "running" ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground/40" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-mono font-bold uppercase tracking-wider ${
                        status === "running"
                          ? "text-primary"
                          : status === "done"
                          ? "text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.agent}
                    </span>
                    {status === "running" && (
                      <span className="text-[10px] font-mono bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase tracking-widest animate-pulse">
                        active
                      </span>
                    )}
                    {status === "done" && (
                      <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-widest">
                        done
                      </span>
                    )}
                  </div>
                  {status !== "waiting" && (
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
