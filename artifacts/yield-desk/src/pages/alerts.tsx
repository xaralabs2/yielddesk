import {
  useListAlerts,
  useMarkAlertRead,
  useGetAlertCount,
  getListAlertsQueryKey,
  getGetAlertCountQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, TrendingUp, Briefcase, AlertTriangle, CheckCircle } from "lucide-react";

export default function AlertsPage() {
  const { data: alerts, isLoading } = useListAlerts();
  const { data: alertCount } = useGetAlertCount();
  const markReadMutation = useMarkAlertRead();
  const queryClient = useQueryClient();

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAlertCountQueryKey() });
        },
      }
    );
  };

  const typeIcons: Record<string, typeof Bell> = {
    MARKET: TrendingUp,
    PORTFOLIO: Briefcase,
    SYSTEM: AlertTriangle,
  };

  const typeColors: Record<string, string> = {
    MARKET: "bg-primary/10 text-primary border-primary/30",
    PORTFOLIO: "bg-warning/10 text-warning border-warning/30",
    SYSTEM: "bg-destructive/10 text-destructive border-destructive/30",
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="alerts-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            {alertCount ? `${alertCount.unread} unread of ${alertCount.total} total` : "Notifications and warnings"}
          </p>
        </div>
      </div>

      {(!alerts || alerts.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No alerts</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const Icon = typeIcons[alert.type] || Bell;
            return (
              <Card
                key={alert.id}
                className={`transition-colors ${!alert.read ? "border-l-4 border-l-primary" : "opacity-70"}`}
                data-testid={`card-alert-${alert.id}`}
              >
                <CardContent className="py-4 flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!alert.read ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`w-4 h-4 ${!alert.read ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-[10px] ${typeColors[alert.type] || ""}`}>{alert.type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                  {!alert.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 gap-1 text-xs"
                      onClick={() => handleMarkRead(alert.id)}
                      data-testid={`button-mark-read-${alert.id}`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Mark read
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
