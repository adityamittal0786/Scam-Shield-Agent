import { Link, useLocation } from "wouter";
import { Shield, History, BarChart3 } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Analyzer", icon: Shield },
    { href: "/history", label: "History", icon: History },
    { href: "/stats", label: "Dashboard", icon: BarChart3 },
  ];

  return (
    <nav className="border-b border-border bg-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold font-mono tracking-tight text-foreground">
              ScamShield
            </span>
          </div>
          <div className="flex gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}