import { Link, useLocation } from "wouter";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/nigeria", label: "Nigeria" },
  { href: "/markets", label: "Markets" },
  { href: "/rates", label: "Rates" },
  { href: "/research", label: "Research" },
  { href: "/simulator", label: "Simulator" },
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-primary">YieldDesk</Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Public navigation">
            {links.map((item) => (
              <Button key={item.href} asChild variant={location === item.href ? "secondary" : "ghost"}>
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost"><Link href="/login">Sign in</Link></Button>
            <Button asChild><Link href="/signup">Save your work</Link></Button>
          </div>
          <Button className="md:hidden" variant="ghost" size="icon" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={open}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        {open ? (
          <nav className="border-t px-5 py-3 md:hidden" aria-label="Mobile navigation">
            <div className="grid gap-1">
              {links.map((item) => <Button key={item.href} asChild variant="ghost" className="justify-start"><Link href={item.href}>{item.label}</Link></Button>)}
              <Button asChild variant="ghost" className="justify-start"><Link href="/login">Sign in</Link></Button>
            </div>
          </nav>
        ) : null}
      </header>
      <main>{children}</main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-8 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>© 2026 YieldDesk</p>
          <p>Information · Education · Comparison · Simulation — not investment advice.</p>
        </div>
      </footer>
    </div>
  );
}
