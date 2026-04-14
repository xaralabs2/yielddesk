import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ArrowUpRight } from "lucide-react";

export function MetricCard({ label, value, subtitle, color, icon: Icon, testId }: { label: string; value: string; subtitle?: string; color?: string; icon?: typeof ArrowUpRight; testId: string }) {
  return (
    <Card data-testid={testId}>
      <CardContent className="p-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{label}</p>
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className={cn("h-4 w-4", color)} />}
          <span className={cn("text-lg font-bold font-mono tabular-nums", color || "text-foreground")}>{value}</span>
        </div>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
