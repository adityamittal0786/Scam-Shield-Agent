import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle, Clock } from "lucide-react";

const LESSONS = [
  {
    id: "fake-jobs",
    title: "Fake Job Scams",
    duration: "3 min",
    preview: "Scammers post fake job listings promising huge salaries for simple remote work",
    howItWorks: "Scammers post fake job listings promising huge salaries for simple remote work. They often target people looking for part-time or flexible jobs.",
    redFlags: ["Upfront fees for 'training' or 'equipment'", "Requests for Aadhaar/bank details before hiring", "No formal interview process"],
    example: "\"Work from home, earn Rs 1000/task, no experience needed\"",
    keyRule: "Legitimate employers NEVER ask for money or sensitive info before hiring"
  },
  {
    id: "qr-code",
    title: "QR Code Scams",
    duration: "3 min",
    preview: "A QR code redirects you to a phishing site or triggers a payment",
    howItWorks: "A QR code redirects you to a phishing site or triggers a payment on your UPI app. They often disguise these as 'refunds' or 'prizes'.",
    redFlags: ["QR codes sent via WhatsApp/SMS", "\"Scan to get refund/prize/verify\""],
    example: "Fake electricity bill QR code that steals payment credentials",
    keyRule: "Always verify QR destination URL before completing any action. Scanning a QR code only SENDS money or OPENS links, it NEVER receives money."
  },
  {
    id: "otp-fraud",
    title: "OTP Fraud",
    duration: "3 min",
    preview: "Scammer tricks you into sharing your OTP, instantly taking control",
    howItWorks: "Scammer tricks you into sharing your OTP (one-time password), instantly taking control of your bank account, WhatsApp, or other accounts.",
    redFlags: ["Anyone asking for your OTP — even claiming to be bank/police/TRAI", "Urgent warnings about account suspension"],
    example: "\"I'm from SBI, please share the OTP sent to your number to verify your account\"",
    keyRule: "NO legitimate organization will EVER ask for your OTP"
  },
  {
    id: "investment",
    title: "Investment Scams",
    duration: "3 min",
    preview: "Promises of unrealistic returns (10x, 100x) through crypto/forex/trading",
    howItWorks: "Promises of unrealistic returns (10x, 100x) through crypto/forex/trading. Scammers build fake dashboards showing your 'profits' growing to encourage more deposits.",
    redFlags: ["Guaranteed returns", "Urgent 'limited spots'", "Celebrity endorsements", "VIP Telegram/WhatsApp groups"],
    example: "\"Join our trading group — our AI bot makes 40% monthly returns guaranteed\"",
    keyRule: "If returns sound too good to be true, it's a scam. Verify with SEBI."
  }
];

export default function Learn() {
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("scamshield_completed_lessons");
    if (saved) {
      try {
        setCompletedLessons(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const toggleComplete = (id: string) => {
    setCompletedLessons(prev => {
      const isCompleted = prev.includes(id);
      const next = isCompleted ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem("scamshield_completed_lessons", JSON.stringify(next));
      return next;
    });
  };

  const progress = Math.round((completedLessons.length / LESSONS.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-mono font-bold tracking-tight flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          Learning Center
        </h1>
        <p className="text-muted-foreground text-lg">
          Master the fundamentals of scam detection. Learn the tactics scammers use so you can spot them before they strike.
        </p>
        
        <div className="bg-card border rounded-xl p-4 mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium font-mono text-muted-foreground">Your Progress</span>
            <span className="text-sm font-bold text-primary">{completedLessons.length}/{LESSONS.length} completed</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {LESSONS.map((lesson) => {
          const isCompleted = completedLessons.includes(lesson.id);
          const isExpanded = expandedLesson === lesson.id;

          return (
            <Card 
              key={lesson.id} 
              className={`transition-all duration-200 border-2 ${isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : 'hover:border-primary/50'}`}
            >
              <CardHeader 
                className="cursor-pointer select-none" 
                onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                data-testid={`lesson-${lesson.id}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                      {lesson.title}
                      {isCompleted && <CheckCircle className="w-5 h-5 text-emerald-500 inline" />}
                    </CardTitle>
                    {!isExpanded && <CardDescription className="text-sm">{lesson.preview}</CardDescription>}
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    {isCompleted && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                        Completed
                      </Badge>
                    )}
                    <Badge variant="secondary" className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {lesson.duration}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-6 pt-2 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold font-mono uppercase text-muted-foreground">How it works</h4>
                    <p className="text-foreground/90">{lesson.howItWorks}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold font-mono uppercase text-muted-foreground">Red Flags</h4>
                    <ul className="list-disc pl-5 space-y-1 text-foreground/90 marker:text-destructive">
                      {lesson.redFlags.map((flag, i) => (
                        <li key={i}>{flag}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold font-mono uppercase text-muted-foreground">Real Example</h4>
                    <div className="p-3 bg-muted rounded-md border text-sm font-mono italic">
                      {lesson.example}
                    </div>
                  </div>

                  <div className="space-y-2 bg-primary/10 border border-primary/20 p-4 rounded-lg">
                    <h4 className="text-sm font-bold font-mono uppercase text-primary">Key Rule</h4>
                    <p className="font-medium text-foreground">{lesson.keyRule}</p>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button 
                      variant={isCompleted ? "outline" : "default"}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleComplete(lesson.id);
                      }}
                      data-testid={`mark-complete-${lesson.id}`}
                    >
                      {isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
