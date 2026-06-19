import { Link, useLocation } from "wouter";
import { Shield, History, BarChart3, BookOpen, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();
  const { user, login, logout, isLoading } = useAuth();

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
          
          {/* Desktop Navigation */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex gap-1 overflow-x-auto">
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
                    {link.label}
                  </Link>
                );
              })}
            </div>
            
            {/* Auth Section */}
            {!isLoading && (
              <div className="flex items-center gap-3 md:border-l md:border-border md:pl-4">
                {user ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 border border-border">
                        <AvatarImage src={user.profileImage} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium hidden sm:inline-block max-w-[120px] truncate">
                        {user.name}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => logout()} data-testid="logout-btn" className="px-2 md:px-3">
                      <LogOut className="w-4 h-4 md:mr-2 shrink-0" />
                      <span className="hidden md:inline-block">Logout</span>
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => login()} data-testid="login-btn">
                    <LogIn className="w-4 h-4 mr-2 shrink-0" />
                    Login
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
