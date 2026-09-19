import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Compass,
  FlaskConical,
  Globe2,
  LayoutDashboard,
  LogOut,
  Moon,
  Monitor,
  Sun,
  Sparkles,
  WalletCards,
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
    <div className="flex items-center gap-1 rounded-md bg-sidebar-accent/50 px-1 py-1" data-testid="theme-toggle">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors",
            theme === option.value
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
          )}
          data-testid={`theme-${option.value}`}
        >
          <option.icon className="h-3 w-3" />
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const { data: alertCount } = useGetAlertCount({
    query: { queryKey: getGetAlertCountQueryKey(), enabled: !!user, refetchInterval: 30000 },
  });

  const groups = [
    {
      label: "Explore",
      items: [
        { href: "/dashboard", label: "My YieldDesk", icon: LayoutDashboard },
        { href: "/market-data", label: "Discover", icon: Compass },
        { href: "/compare", label: "Compare markets", icon: BarChart3 },
        { href: "/diaspora", label: "Cross-border context", icon: Globe2 },
      ],
    },
    {
      label: "Practice & track",
      items: [
        { href: "/wealth-builder", label: "Wealth Builder", icon: Sparkles },
        { href: "/simulator", label: "Simulate", icon: FlaskConical },
        { href: "/portfolio", label: "Virtual portfolios", icon: BriefcaseBusiness },
        { href: "/holdings", label: "Recorded holdings", icon: WalletCards },
        {
          href: "/alerts",
          label: "Monitor",
          icon: Bell,
          badge: alertCount?.unread ? alertCount.unread : undefined,
        },
      ],
    },
  ];

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-6 py-5">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight text-sidebar-primary">YieldDesk</Link>
        <p className="mt-1 text-[11px] text-sidebar-foreground/50">Understand across markets</p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/40">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = location === item.href || location.startsWith(`${item.href}/`);
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={cn(
                      "group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}>
                      <item.icon className={cn("h-4 w-4", active ? "text-sidebar-primary" : "text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80")} />
                      {item.label}
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">{item.badge}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <p className="mb-3 px-2 text-[10px] leading-4 text-sidebar-foreground/45">Information, education, comparison and simulation. YieldDesk does not recommend investments or providers.</p>
        <ThemeToggle />
        <div className="mb-2 mt-3 flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary/20 text-xs font-bold text-sidebar-primary">{user?.email?.charAt(0).toUpperCase() || "U"}</div>
          <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{user?.email}</div><div className="text-xs capitalize text-sidebar-foreground/50">{user?.role}</div></div>
        </div>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"><LogOut className="h-4 w-4" />Sign out</button>
      </div>
    </aside>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" /></div>;
  }

  if (!user) return <>{children}</>;

  return <div className="flex h-screen overflow-hidden bg-background"><Sidebar /><main className="flex-1 overflow-y-auto">{children}</main></div>;
}
