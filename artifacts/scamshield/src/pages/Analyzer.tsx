import { useState, useRef } from "react";
import { useAnalyzeContent, useGetEmergencyActions, getGetAnalysisHistoryQueryKey, getGetScamStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Shield, AlertCircle, UploadCloud, TriangleAlert, FileImage } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AnalysisLoadingState } from "@/components/AnalysisLoadingState";
import { AnalysisResultView } from "@/components/AnalysisResultView";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import jsQR from "jsqr";

const QUICK_EXAMPLES = [
  {
    type: "Phishing",
    risk: "Critical",
    text: "URGENT: Your SBI account has been suspended. Click http://sbi-verify-now.xyz to restore access within 2 hours or your account will be closed permanently."
  },
  {
    type: "Job Scam",
    risk: "High",
    text: "Congratulations! You have been selected for a Work From Home job paying Rs 50,000/month. No experience needed. Send your Aadhaar and bank details to confirm."
  },
  {
    type: "Impersonation",
    risk: "Critical",
    text: "Hi, I'm Captain Sharma from Cyber Crime Division. Your phone number is linked to illegal activities. You must pay Rs 5000 fine immediately to avoid arrest."
  },
  {
    type: "Delivery Scam",
    risk: "High",
    text: "Your package from Amazon could not be delivered. Scan the QR code below to reschedule: [QR: http://amaz0n-delivery.tk/reschedule?id=84729]"
  }
];

export default function Analyzer() {
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState("text");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Emergency Mode State
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyContext, setEmergencyContext] = useState("");
  const [emergencyExposures, setEmergencyExposures] = useState<string[]>([]);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const analyzeMutation = useAnalyzeContent();
  const emergencyMutation = useGetEmergencyActions();

  const handleAnalyze = (textToAnalyze = content) => {
    if (!textToAnalyze.trim()) {
      toast({
        title: "Input required",
        description: "Please paste a message or upload a QR code to analyze.",
        variant: "destructive"
      });
      return;
    }

    analyzeMutation.mutate(
      { data: { content: textToAnalyze } },
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
  
  const handleQuickExample = (text: string) => {
    setContent(text);
    setActiveTab("text");
    handleAnalyze(text);
  };

  // QR Processing
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          toast({ title: "QR Code Decoded", description: "Analyzing destination URL..." });
          setContent(code.data);
          setActiveTab("text");
          handleAnalyze(code.data);
        } else {
          toast({ title: "No QR code found", description: "Could not decode a QR code from this image.", variant: "destructive" });
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Emergency Handlers
  const handleEmergencySubmit = () => {
    if (emergencyExposures.length === 0 && !emergencyContext.trim()) {
      toast({ title: "Select an option", description: "Please tell us what happened so we can help.", variant: "destructive" });
      return;
    }
    
    emergencyMutation.mutate({
      data: {
        exposures: emergencyExposures as any[],
        scamContext: emergencyContext
      }
    });
  };

  const resetEmergency = () => {
    setEmergencyOpen(false);
    setTimeout(() => {
      emergencyMutation.reset();
      setEmergencyExposures([]);
      setEmergencyContext("");
    }, 300);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-foreground flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          Threat Analyzer
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Paste any suspicious URLs, QR codes, emails, job offers, text messages, or social media posts. Our AI will break down exactly what it is and why it's dangerous.
        </p>
      </div>

      {!analyzeMutation.isPending && !analyzeMutation.isSuccess && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Quick Examples */}
          <div className="space-y-3">
            <h3 className="text-sm font-mono uppercase font-bold text-muted-foreground flex items-center gap-2">
              <Shield className="w-4 h-4" /> Try a Quick Example
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {QUICK_EXAMPLES.map((example, i) => (
                <Card 
                  key={i} 
                  className="cursor-pointer hover:border-primary/50 transition-colors border-dashed bg-card/50"
                  onClick={() => handleQuickExample(example.text)}
                  data-testid={`example-card-${i}`}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">{example.type}</Badge>
                      <Badge variant="secondary" className={`text-[10px] uppercase font-mono ${example.risk === 'Critical' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'}`}>
                        {example.risk}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      "{example.text}"
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="text" className="font-mono uppercase text-xs tracking-wider">Paste Text</TabsTrigger>
              <TabsTrigger value="image" className="font-mono uppercase text-xs tracking-wider flex gap-2">
                <FileImage className="w-4 h-4" /> Upload QR Image
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="space-y-4">
              <div className="relative">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={"Paste anything suspicious here...\n\nExamples:\n• 'URGENT: Your bank account has been locked. Click http://secure-verify.xyz to restore access.'\n• 'Congratulations! You have been selected for a $500/day work-from-home position.'\n• A URL like: http://amaz0n-support.net/account-verify\n• A phone call script"}
                  className="min-h-[250px] font-mono text-sm resize-y p-6 bg-card border-2 focus-visible:ring-primary/50 shadow-sm"
                  data-testid="analyzer-textarea"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="image" className="space-y-4">
              <div 
                className={`min-h-[250px] border-2 border-dashed rounded-md flex flex-col items-center justify-center p-8 transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-card/50 hover:bg-muted/50'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-mono font-medium text-lg mb-2 text-foreground">Drag & Drop QR Code</h3>
                <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
                  Upload an image containing a QR code to extract and analyze its hidden destination.
                </p>
                <Button variant="secondary" className="pointer-events-none">Select Image</Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) processImageFile(e.target.files[0]);
                  }}
                  data-testid="qr-file-input"
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-4 py-2 rounded-md">
              <AlertCircle className="w-4 h-4 shrink-0 text-primary" />
              <span>Do not paste highly sensitive personal info.</span>
            </div>
            <Button 
              onClick={() => handleAnalyze()} 
              disabled={(!content.trim() && activeTab === 'text') || analyzeMutation.isPending}
              size="lg"
              className="font-mono font-bold uppercase tracking-widest px-8 w-full sm:w-auto relative group overflow-hidden"
              data-testid="analyze-btn"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              Analyze Threat
            </Button>
          </div>

          <div className="pt-8 border-t border-border mt-8 flex justify-center">
            <Button 
              variant="destructive" 
              size="lg"
              className="w-full sm:w-auto shadow-lg shadow-destructive/20 border border-destructive hover:bg-destructive/90"
              onClick={() => setEmergencyOpen(true)}
              data-testid="emergency-btn"
            >
              <TriangleAlert className="w-5 h-5 mr-2" />
              I Already Clicked — What Should I Do?
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
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleReset} className="font-mono text-xs uppercase">
              Analyze Another Message
            </Button>
          </div>
          <AnalysisResultView result={analyzeMutation.data} />
        </div>
      )}

      {/* Emergency Modal */}
      <Dialog open={emergencyOpen} onOpenChange={setEmergencyOpen}>
        <DialogContent className="sm:max-w-2xl border-destructive/30 shadow-2xl shadow-destructive/10">
          
          {emergencyMutation.isPending ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                <TriangleAlert className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-mono font-bold animate-pulse text-foreground">Generating Action Plan...</h3>
                <p className="text-muted-foreground text-sm">Consulting cybersecurity protocols for your specific situation.</p>
              </div>
            </div>
          ) : emergencyMutation.isSuccess && emergencyMutation.data ? (
            <div className="space-y-6 pt-2">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full shrink-0 ${
                  emergencyMutation.data.severity === 'critical' ? 'bg-red-500/20 text-red-500 animate-pulse' :
                  emergencyMutation.data.severity === 'serious' ? 'bg-orange-500/20 text-orange-500' :
                  'bg-yellow-500/20 text-yellow-500'
                }`}>
                  <TriangleAlert className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <DialogTitle className="text-xl font-bold uppercase font-mono tracking-tight flex items-center gap-2">
                    Emergency Response Plan
                    <Badge variant="outline" className={`ml-2 uppercase font-mono border-2 ${
                      emergencyMutation.data.severity === 'critical' ? 'border-red-500 text-red-500' :
                      emergencyMutation.data.severity === 'serious' ? 'border-orange-500 text-orange-500' :
                      'border-yellow-500 text-yellow-500'
                    }`}>
                      {emergencyMutation.data.severity}
                    </Badge>
                  </DialogTitle>
                  <p className="text-sm font-medium leading-relaxed text-foreground/90 bg-muted p-3 rounded-md border border-border/60">
                    {emergencyMutation.data.summary}
                  </p>
                </div>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {emergencyMutation.data.actions.map((action, i) => (
                  <Card key={i} className={`border-l-4 ${
                    action.priority === 'immediate' ? 'border-l-red-500 bg-red-500/5' :
                    action.priority === 'high' ? 'border-l-orange-500 bg-orange-500/5' :
                    'border-l-yellow-500 bg-yellow-500/5'
                  }`}>
                    <CardContent className="p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm uppercase tracking-wide font-mono flex items-center gap-2 text-foreground">
                          {i + 1}. {action.title}
                        </h4>
                        <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
                          {action.timeframe}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{action.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {emergencyMutation.data.hotlines && emergencyMutation.data.hotlines.length > 0 && (
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl space-y-3">
                  <h4 className="font-bold font-mono text-sm uppercase tracking-wide text-primary">Emergency Contacts</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {emergencyMutation.data.hotlines.map((hotline, i) => (
                      <div key={i} className="bg-card p-3 rounded-md border">
                        <span className="font-mono text-sm text-foreground">{hotline}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button onClick={resetEmergency} variant="outline" className="w-full">Close Plan</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl text-destructive font-mono uppercase tracking-tight">
                  <TriangleAlert className="w-6 h-6" />
                  Emergency Response
                </DialogTitle>
                <DialogDescription className="text-base font-medium">
                  Tell us what happened so we can help you immediately. Select all that apply.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "otp", label: "I shared my OTP" },
                    { id: "bank_details", label: "I shared bank/card details" },
                    { id: "installed_app", label: "I installed an app" },
                    { id: "scanned_qr", label: "I scanned a QR code" },
                    { id: "sent_money", label: "I sent money" },
                    { id: "shared_password", label: "I shared my password" },
                    { id: "clicked_link", label: "I clicked a suspicious link" }
                  ].map((option) => (
                    <div key={option.id} className="flex items-center space-x-3 bg-muted/50 p-3 rounded-md border border-border/50 hover:bg-muted transition-colors">
                      <Checkbox 
                        id={`exp-${option.id}`} 
                        checked={emergencyExposures.includes(option.id)}
                        onCheckedChange={(checked) => {
                          if (checked) setEmergencyExposures(prev => [...prev, option.id]);
                          else setEmergencyExposures(prev => prev.filter(x => x !== option.id));
                        }}
                      />
                      <Label htmlFor={`exp-${option.id}`} className="font-medium cursor-pointer flex-1">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="scam-context">Additional Context (Optional)</Label>
                  <Input 
                    id="scam-context" 
                    placeholder="e.g. They called claiming to be from FedEx..." 
                    value={emergencyContext}
                    onChange={(e) => setEmergencyContext(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={resetEmergency}>Cancel</Button>
                <Button 
                  variant="destructive" 
                  onClick={handleEmergencySubmit}
                  className="font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white"
                  data-testid="get-emergency-help"
                >
                  Get Emergency Help
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
