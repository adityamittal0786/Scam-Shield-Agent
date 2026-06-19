import { AnalysisResult } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, CheckCircle, Info, Shield, ShieldAlert, Lightbulb, UserCheck, Users, Crosshair, Globe } from "lucide-react";

interface AnalysisResultViewProps {
  result: AnalysisResult;
}

export function AnalysisResultView({ result }: AnalysisResultViewProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case "Low":    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "Medium": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      case "High":   return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      case "Critical": return "bg-red-500/10 text-red-400 border-red-500/30";
      default:       return "bg-muted text-muted-foreground border-border";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-red-400";
    if (score >= 60) return "text-orange-400";
    if (score >= 40) return "text-yellow-400";
    return "text-emerald-400";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "[&>div]:bg-red-500";
    if (score >= 60) return "[&>div]:bg-orange-500";
    if (score >= 40) return "[&>div]:bg-yellow-500";
    return "[&>div]:bg-emerald-500";
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "Low":    return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case "Medium":
      case "High":   return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case "Critical": return <ShieldAlert className="w-5 h-5 text-red-400" />;
      default:       return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getBorderAccent = (level: string) => {
    switch (level) {
      case "Critical": return "border-red-500/40";
      case "High":     return "border-orange-500/40";
      case "Medium":   return "border-yellow-500/40";
      default:         return "border-emerald-500/40";
    }
  };

  return (
    <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">

      {/* ── HEADER CARD ── */}
      <Card className={`border-2 shadow-xl ${getBorderAccent(result.riskLevel)}`}>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                {getRiskIcon(result.riskLevel)}
                <CardTitle className="text-2xl font-mono tracking-tight uppercase">Analysis Complete</CardTitle>
              </div>
              <CardDescription className="text-sm flex items-center gap-2 flex-wrap">
                Identified as:
                <Badge variant="outline" className="font-mono text-primary border-primary/30 bg-primary/5">
                  {result.type}
                </Badge>
              </CardDescription>
            </div>

            {/* Risk level + Threat Score side by side */}
            <div className="flex items-stretch gap-3">
              <div className={`px-5 py-3 rounded-lg border-2 flex flex-col items-center justify-center min-w-[110px] ${getRiskColor(result.riskLevel)}`}>
                <div className="text-[10px] font-mono uppercase tracking-widest mb-1 opacity-70">Risk Level</div>
                <div className="text-xl font-bold tracking-tight">{result.riskLevel}</div>
              </div>
              <div className="px-5 py-3 rounded-lg border-2 border-border/60 bg-card flex flex-col items-center justify-center min-w-[120px]">
                <div className="text-[10px] font-mono uppercase tracking-widest mb-1 text-muted-foreground">Threat Score</div>
                <div className={`text-3xl font-bold font-mono tracking-tighter ${getScoreColor(result.confidenceScore)}`}>
                  {result.confidenceScore}<span className="text-sm text-muted-foreground font-normal">/100</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-1.5 pt-3 border-t border-border/40">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">AI Confidence</span>
              <span className="text-primary font-semibold">{result.confidenceScore}%</span>
            </div>
            <Progress value={result.confidenceScore} className={`h-1.5 ${getProgressColor(result.confidenceScore)}`} />
          </div>
        </CardContent>
      </Card>

      {/* ── ELI15 ── */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-5 flex gap-4 items-start">
          <div className="bg-primary/20 p-2.5 rounded-full shrink-0 mt-0.5">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold mb-1.5 font-mono text-foreground">The Bottom Line</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{result.eli15}</p>
          </div>
        </CardContent>
      </Card>

      {/* ── RED FLAGS + WHAT TO DO ── */}
      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              Red Flags Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {result.reasoning.map((reason, i) => (
                <li key={i} className="flex gap-2.5 items-start">
                  <span className="text-destructive mt-0.5 shrink-0">•</span>
                  <span className="text-sm text-muted-foreground">{reason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-4 h-4 text-primary" />
              What You Should Do
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {result.recommendedActions.map((action, i) => (
                <li key={i} className="flex gap-2.5 items-start">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{action}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* ── URL INTELLIGENCE ── */}
      {result.urlIntelligence?.isUrl === true && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="w-4 h-4 text-blue-400" />
              URL Safety Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-mono">Domain</span>
                <p className="font-mono text-sm text-foreground truncate" title={result.urlIntelligence.domain || ""}>
                  {result.urlIntelligence.domain || "Unknown"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-mono">Threat Score</span>
                <p className={`font-mono font-bold text-sm ${getScoreColor(result.urlIntelligence.threatScore || 0)}`}>
                  {result.urlIntelligence.threatScore}/100
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-mono">Typosquatting</span>
                <div>
                  {result.urlIntelligence.possibleTyposquatting ? (
                    <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30 uppercase font-mono text-[10px]">
                      Yes: {result.urlIntelligence.typosquattingTarget}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground font-mono text-[10px] uppercase">No</Badge>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-mono">URL Shortener</span>
                <div>
                  {result.urlIntelligence.usesUrlShortener ? (
                    <Badge variant="secondary" className="bg-orange-500/20 text-orange-500 border-orange-500/30 uppercase font-mono text-[10px]">Yes</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground font-mono text-[10px] uppercase">No</Badge>
                  )}
                </div>
              </div>
            </div>

            {result.urlIntelligence.suspiciousKeywords && result.urlIntelligence.suspiciousKeywords.length > 0 && (
              <div className="space-y-2 border-t border-blue-500/10 pt-4">
                <span className="text-xs text-muted-foreground uppercase font-mono">Suspicious Keywords Found</span>
                <div className="flex flex-wrap gap-2">
                  {result.urlIntelligence.suspiciousKeywords.map((kw, i) => (
                    <Badge key={i} variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 font-mono text-xs">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {result.urlIntelligence.recommendation && (
              <p className="text-sm italic text-muted-foreground mt-2 border-l-2 border-blue-500/30 pl-3">
                {result.urlIntelligence.recommendation}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── WHO IS MOST VULNERABLE ── */}
      {result.vulnerableGroups && result.vulnerableGroups.length > 0 && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-yellow-400" />
              Who Is Most Vulnerable?
            </CardTitle>
            <CardDescription className="text-xs">
              These groups are statistically more likely to be targeted or deceived by this scam type.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.vulnerableGroups.map((group, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md px-3 py-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                  <span className="text-sm text-yellow-200/90">{group}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── HOW SCAMMERS HOOK YOU ── */}
      {result.scammerStrategy && result.scammerStrategy.length > 0 && (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Crosshair className="w-4 h-4 text-orange-400" />
              How Scammers Hook You
            </CardTitle>
            <CardDescription className="text-xs">
              The step-by-step attack chain this scammer uses to extract money or data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {result.scammerStrategy.map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold font-mono flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm text-muted-foreground pt-0.5">{step.replace(/^Step \d+:\s*/i, "")}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* ── PSYCHOLOGICAL TACTICS ── */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="w-4 h-4 text-primary" />
            Psychological Tactics Used
          </CardTitle>
          <CardDescription className="text-xs">Understanding how scammers manipulate emotions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground bg-muted/50 px-4 py-3 rounded-md italic border border-border/60">
            "{result.educationMode.whyThisMatters}"
          </p>

          <Accordion type="single" collapsible className="w-full">
            {result.educationMode.techniques.map((tech, i) => (
              <AccordionItem value={`tech-${i}`} key={i}>
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3 text-left">
                    {tech.detected ? (
                      <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30 uppercase font-mono text-[10px] shrink-0">
                        Detected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground font-mono text-[10px] uppercase shrink-0">
                        Not Found
                      </Badge>
                    )}
                    <span className="font-semibold text-sm">{tech.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm pl-[88px] pb-3">
                  {tech.explanation}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
