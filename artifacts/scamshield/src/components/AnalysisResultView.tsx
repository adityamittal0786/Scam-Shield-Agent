import { AnalysisResult } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, CheckCircle, Info, Shield, ShieldAlert, Target, Lightbulb, UserCheck } from "lucide-react";

interface AnalysisResultViewProps {
  result: AnalysisResult;
}

export function AnalysisResultView({ result }: AnalysisResultViewProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case "Low":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "Medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "High":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "Critical":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "Low":
        return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      case "Medium":
      case "High":
        return <AlertTriangle className="w-6 h-6 text-orange-500" />;
      case "Critical":
        return <ShieldAlert className="w-6 h-6 text-red-500" />;
      default:
        return <Info className="w-6 h-6 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <Card className="border-2 shadow-lg" style={{ borderColor: result.riskLevel === 'Critical' ? 'hsl(var(--destructive)/0.5)' : result.riskLevel === 'High' ? 'hsl(var(--accent)/0.5)' : undefined }}>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {getRiskIcon(result.riskLevel)}
                <CardTitle className="text-3xl font-mono tracking-tight uppercase">Analysis Complete</CardTitle>
              </div>
              <CardDescription className="text-base flex items-center gap-2">
                Identified as: <Badge variant="outline" className="font-mono text-primary border-primary/20 bg-primary/5">{result.type}</Badge>
              </CardDescription>
            </div>
            
            <div className={`px-6 py-3 rounded-lg border-2 flex flex-col items-center justify-center min-w-[140px] ${getRiskColor(result.riskLevel)}`}>
              <div className="text-xs font-mono uppercase tracking-wider mb-1 opacity-80">Risk Level</div>
              <div className="text-2xl font-bold tracking-tight">{result.riskLevel}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex justify-between text-sm font-mono mb-1">
              <span className="text-muted-foreground">Confidence Score</span>
              <span className="text-primary font-bold">{result.confidenceScore}%</span>
            </div>
            <Progress value={result.confidenceScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* ELI15 Section */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 flex gap-4 items-start">
          <div className="bg-primary/20 p-3 rounded-full shrink-0">
            <Lightbulb className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 font-mono text-foreground">The Bottom Line</h3>
            <p className="text-muted-foreground leading-relaxed">
              {result.eli15}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Why this is suspicious */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="w-5 h-5 text-accent" />
              Red Flags Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.reasoning.map((reason, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="text-accent mt-0.5">•</span>
                  <span className="text-sm text-muted-foreground">{reason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recommended Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" />
              What You Should Do
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.recommendedActions.map((action, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{action}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Education Mode */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCheck className="w-5 h-5 text-primary" />
            Psychological Tactics Used
          </CardTitle>
          <CardDescription>Understanding how scammers manipulate emotions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md italic border border-border">
            "{result.educationMode.whyThisMatters}"
          </p>
          
          <Accordion type="single" collapsible className="w-full">
            {result.educationMode.techniques.map((tech, i) => (
              <AccordionItem value={`tech-${i}`} key={i}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    {tech.detected ? (
                      <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30 uppercase font-mono text-[10px]">Detected</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground font-mono text-[10px] uppercase">Not Found</Badge>
                    )}
                    <span className="font-semibold">{tech.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pl-[90px]">
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