import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, ArrowUpRight, Building2, PenLine, Landmark } from "lucide-react";
import type { MmRatesData, GeCpData } from "./types";
import { formatDate } from "./types";

type RatesTabsProps = {
  allRates: MmRatesData | undefined;
  geCp: GeCpData | undefined;
  onDeleteRate: (id: number) => void;
};

export function RatesTabs({ allRates, geCp, onDeleteRate }: RatesTabsProps) {
  return (
    <Tabs defaultValue="proxy" data-testid="tabs-mm-rates">
      <TabsList>
        <TabsTrigger value="proxy">NTB/OMO Proxies</TabsTrigger>
        <TabsTrigger value="fmdq">FMDQ Rates</TabsTrigger>
        <TabsTrigger value="getequity">GetEquity CP</TabsTrigger>
        <TabsTrigger value="manual">Manual Entries</TabsTrigger>
      </TabsList>

      <TabsContent value="proxy">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowUpRight className="w-4 h-4" /> NTB &amp; OMO Rates (MM Proxy)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Tenor</th>
                    <th className="px-4 py-3">Rate</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(allRates?.proxy ?? []).map((r) => (
                    <tr key={`proxy-${r.id}`} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{r.rateType}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{r.tenor}</td>
                      <td className="px-4 py-3 font-mono font-medium">
                        {r.rate != null ? `${r.rate.toFixed(2)}%` : "---"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(r.date)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{r.notes}</td>
                    </tr>
                  ))}
                  {(allRates?.proxy ?? []).length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No proxy data available. Sync CBN data first.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="fmdq">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-4 h-4" /> FMDQ Market Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3">Rate Type</th>
                    <th className="px-4 py-3">Tenor</th>
                    <th className="px-4 py-3">Rate</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(allRates?.fmdq ?? []).map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{r.rateType}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{r.tenor}</td>
                      <td className="px-4 py-3 font-mono font-medium">{r.rate.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(r.date)}</td>
                    </tr>
                  ))}
                  {(allRates?.fmdq ?? []).length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No FMDQ data. Click "Sync FMDQ" to fetch rates.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="getequity">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="w-4 h-4" /> GetEquity — Commercial Paper & Fixed Income
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {geCp && !geCp.configured ? (
              <div className="px-4 py-8 text-center text-muted-foreground">
                <p className="text-sm font-medium">GetEquity API not configured</p>
                <p className="text-xs mt-1">Add your GETEQUITY_API_KEY to environment secrets to fetch live CP instruments.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="px-4 py-3">Instrument</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Interest</th>
                      <th className="px-4 py-3">Tenor</th>
                      <th className="px-4 py-3">Price (NGN)</th>
                      <th className="px-4 py-3">Raise Target</th>
                      <th className="px-4 py-3">Payout</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(geCp?.tokens ?? []).map((t) => (
                      <tr key={t._id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {t.image && <img src={t.image} alt="" className="w-6 h-6 rounded-full" />}
                            <div>
                              <div className="font-medium text-xs">{t.name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">{t.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {t.investment_category || t.investment_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-emerald-500">
                          {t.interest > 0 ? `${t.interest}%` : "---"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {t.tenor > 0 ? `${t.tenor} days` : "---"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {t.price.buy > 0 ? `₦${t.price.buy.toLocaleString()}` : "---"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {t.raise_amount > 0 ? `₦${t.raise_amount.toLocaleString()}` : "---"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {t.payout_frequency || "---"}
                        </td>
                        <td className="px-4 py-3">
                          {t.completed_raise ? (
                            <Badge variant="secondary" className="text-xs">Closed</Badge>
                          ) : (
                            <Badge className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Open</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(geCp?.tokens ?? []).length === 0 && geCp?.configured && (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No commercial paper or fixed income instruments found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="manual">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PenLine className="w-4 h-4" /> Manual Rate Entries
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3">Rate Type</th>
                    <th className="px-4 py-3">Tenor</th>
                    <th className="px-4 py-3">Rate</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {(allRates?.manual ?? []).map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{r.rateType}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{r.tenor}</td>
                      <td className="px-4 py-3 font-mono font-medium">{r.rate.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(r.date)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{r.notes || "---"}</td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => onDeleteRate(r.id)}
                          data-testid={`button-delete-mm-${r.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(allRates?.manual ?? []).length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No manual entries. Click "Add Rate" to enter dealer quotes.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
