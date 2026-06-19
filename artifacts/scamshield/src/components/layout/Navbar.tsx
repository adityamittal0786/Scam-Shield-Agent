import { Link, useLocation } from "wouter";
import { Shield, History, BarChart3, BookOpen } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Analyzer", icon: Shield },
    { href: "/history", label: "History", icon: History },
    { href: "/stats", label: "Dashboard", icon: BarChart3 },
    { href: "/learn", label: "Learn", icon: BookOpen },
  ];

  return (
    <nav className="border-b border-border bg-card shadow-sm h-16 md:h-[72px] flex items-center transition-all sticky top-0 z-50">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-full justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            <span className="text-xl md:text-2xl font-bold font-mono tracking-tight text-foreground">
              ScamShield
            </span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
