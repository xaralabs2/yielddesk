import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

function PillarGuideItem({ color, name, description }: { color: string; name: string; description: string }) {
  return (
    <div className="flex gap-2">
      <div className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", color)} />
      <div>
        <span className="text-xs font-semibold text-foreground">{name}</span>
        <p className="text-[10px] text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function RebalanceGuideRow({ signal, action }: { signal: string; action: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-muted-foreground shrink-0 w-[45%]">{signal}</span>
      <span className="text-foreground">{action}</span>
    </div>
  );
}

export function GuideSection() {
  return (
    <Card data-testid="card-guide">
      <CardHeader className="flex flex-row items-center gap-2 pb-3 p-4">
        <BookOpen className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">Operating Guide</h3>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">The Three Pillars</h4>
            <div className="space-y-2">
              <PillarGuideItem color="bg-teal-500" name="Stability (10%)" description="Bonds, ETFs, Money Market Funds, short-duration instruments. Provides liquidity and prevents forced selling. Risk: inflation may exceed returns." />
              <PillarGuideItem color="bg-emerald-500" name="Inflation Hedge (15%)" description="Bank stocks, cement, energy equities, productive assets that reprice with inflation. This is where real wealth grows in Nigeria." />
              <PillarGuideItem color="bg-amber-500" name="Strategic (75%)" description="Property, SPVs, private deals. The core wealth engine. Low liquidity but strong long-term store of value." />
            </div>
          </div>
          <div className="border-t border-border/50 pt-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Monthly Routine (10 minutes)</h4>
            <ol className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex gap-2"><span className="text-foreground font-mono font-semibold shrink-0">1.</span> Update your holding values in the tracker</li>
              <li className="flex gap-2"><span className="text-foreground font-mono font-semibold shrink-0">2.</span> Check pillar weights and drift signals</li>
              <li className="flex gap-2"><span className="text-foreground font-mono font-semibold shrink-0">3.</span> If no alerts appear, do nothing. Discipline is wealth.</li>
            </ol>
          </div>
          <div className="border-t border-border/50 pt-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">When Rebalance Alerts Trigger</h4>
            <div className="space-y-1.5">
              <RebalanceGuideRow signal="Stability too high" action="Deploy into productive assets" />
              <RebalanceGuideRow signal="Inflation pillar too large" action="Harvest gains, refill liquidity" />
              <RebalanceGuideRow signal="Strategic underweight" action="Allocate to property/SPVs" />
              <RebalanceGuideRow signal="Real return negative" action="Reassess allocation urgently" />
            </div>
          </div>
          <div className="border-t border-border/50 pt-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Real Return: The Key Metric</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nigeria wealth destruction happens silently through inflation. A portfolio growing 12% when inflation is 15%
              means <span className="text-foreground font-medium">you are losing purchasing power</span>. This tracker uses Fisher-adjusted
              real returns to show you the truth: whether your wealth is actually growing after inflation.
            </p>
          </div>
          <div className="border-t border-border/50 pt-3">
            <p className="text-[10px] text-muted-foreground/60 italic">
              This is an allocation-driven system, not a trading dashboard. Update values monthly or quarterly.
              The system recalculates automatically using live inflation data.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
