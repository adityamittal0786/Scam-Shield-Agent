import { useState } from "react";
import { useAnalyzeContent, getGetAnalysisHistoryQueryKey, getGetScamStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AnalysisLoadingState } from "@/components/AnalysisLoadingState";
import { AnalysisResultView } from "@/components/AnalysisResultView";

export default function Analyzer() {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const analyzeMutation = useAnalyzeContent();

  const handleAnalyze = () => {
    if (!content.trim()) {
      toast({
        title: "Input required",
        description: "Please paste a message to analyze.",
        variant: "destructive"
      });
      return;
    }

    analyzeMutation.mutate(
      { data: { content } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAnalysisHistoryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetScamStatsQueryKey() });
        },
        onError: (error) => {
          toast({
            title: "Analysis Failed",
            description: error.error || "An unexpected error occurred during analysis.",
            variant: "destructive"
          });
        }
      }
    );
  };

  const handleReset = () => {
    setContent("");
    analyzeMutation.reset();
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-foreground flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          Threat Analyzer
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Paste any suspicious text message, email, or social media message below. Our AI will break down exactly what it is and why it's dangerous.
        </p>
      </div>

      {!analyzeMutation.isPending && !analyzeMutation.isSuccess && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="relative">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the suspicious message here... (e.g. 'URGENT: Your account has been locked. Click here to verify...')"
              className="min-h-[250px] font-mono text-sm resize-y p-6 bg-card border-2 focus-visible:ring-primary/50"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span>Do not paste highly sensitive personal info (like full SSNs or passwords).</span>
            </div>
            <Button 
              onClick={handleAnalyze} 
              disabled={!content.trim() || analyzeMutation.isPending}
              size="lg"
              className="font-mono font-bold uppercase tracking-widest px-8"
            >
              Analyze Threat
            </Button>
          </div>
        </div>
      )}

      {analyzeMutation.isPending && (
        <div className="h-[400px] border-2 border-dashed border-border rounded-xl bg-card/50 flex items-center justify-center">
          <AnalysisLoadingState />
        </div>
      )}

      {analyzeMutation.isSuccess && analyzeMutation.data && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleReset} className="font-mono text-xs uppercase">
              Analyze Another Message
            </Button>
          </div>
          <AnalysisResultView result={analyzeMutation.data} />
        </div>
      )}
    </div>
  );
}