import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  BarChart3, 
  Briefcase, 
  WalletCards, 
  LineChart, 
  Bell, 
  Activity, 
  LogOut,
  LayoutDashboard,
  Landmark,
  Sun,
  Moon,
  Monitor,
  Coins,
} from "lucide-react";
import { useGetAlertCount, getGetAlertCountQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
    { value: "system" as const, icon: Monitor, label: "System" },
  ];

  return (
    <div className="flex items-center gap-1 px-1 py-1 rounded-md bg-sidebar-accent/50" data-testid="theme-toggle">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors flex-1 justify-center",
            theme === opt.value
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
          )}
          data-testid={`theme-${opt.value}`}
        >
          <opt.icon className="w-3 h-3" />
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  
  const { data: alertCount } = useGetAlertCount({
    query: {
      queryKey: getGetAlertCountQueryKey(),
      enabled: !!user,
      refetchInterval: 30000
    }
  });

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/portfolio", label: "Portfolio", icon: Briefcase },
    { href: "/holdings", label: "Holdings", icon: WalletCards },
    { href: "/deals", label: "Deals", icon: LineChart },
    { href: "/market-data", label: "Market Data", icon: Landmark },
    { href: "/mm-rates", label: "MM Rates", icon: Coins },
    { href: "/signals", label: "Signals", icon: Activity },
    { 
      href: "/alerts", 
      label: "Alerts", 
      icon: Bell, 
      badge: alertCount?.unread ? alertCount.unread : undefined 
    },
  ];

  return (
    <div className="w-64 border-r bg-sidebar flex flex-col h-screen shrink-0 text-sidebar-foreground">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
        <h1 className="font-bold text-xl tracking-tighter text-sidebar-primary">YieldDesk</h1>
      </div>
      
      <div className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer group",
                active 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}>
                <item.icon className={cn(
                  "w-4 h-4", 
                  active ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                )} />
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border shrink-0">
        <ThemeToggle />
        <div className="flex items-center gap-3 px-3 py-2 mb-2 mt-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary font-bold text-xs">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.email}</div>
            <div className="text-xs text-sidebar-foreground/50 capitalize">{user?.role}</div>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
