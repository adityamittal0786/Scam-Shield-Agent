import { Shield, Search, Lock, ShieldAlert } from "lucide-react";

export function AnalysisLoadingState() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-12 space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Search className="w-10 h-10 text-primary animate-pulse" />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-xl font-mono font-semibold text-foreground tracking-tight">ANALYZING CONTENT</h3>
        <p className="text-muted-foreground font-mono text-sm max-w-sm mx-auto">
          Scanning for psychological manipulation, urgency indicators, and known threat patterns...
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-md pt-4">
        <div className="flex flex-col items-center justify-center p-3 bg-card border border-border rounded-md opacity-50 animate-pulse">
          <ShieldAlert className="w-5 h-5 mb-2 text-primary" />
          <div className="text-xs font-mono">Threats</div>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-card border border-border rounded-md opacity-50 animate-pulse delay-75">
          <Lock className="w-5 h-5 mb-2 text-primary" />
          <div className="text-xs font-mono">Links</div>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-card border border-border rounded-md opacity-50 animate-pulse delay-150">
          <Shield className="w-5 h-5 mb-2 text-primary" />
          <div className="text-xs font-mono">Patterns</div>
        </div>
      </div>
    </div>
  );
}