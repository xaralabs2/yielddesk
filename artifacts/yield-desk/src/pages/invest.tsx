import { useState } from "react";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  TrendingUp,
  Shield,
  Clock,
  PiggyBank,
  BarChart3,
  Lock,
  ChevronRight,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: typeof TrendingUp;
  ytdReturn: string;
  riskLevel: "Low" | "Medium" | "High";
  minInvestment: number;
  minRecurring: number;
  minTenor: string;
  maxTenor: string;
  returnsType: string;
  color: string;
  details: Record<string, string>;
}

const PRODUCTS: Product[] = [
  {
    id: "equity-market-fund",
    name: "Equity Market Fund",
    shortName: "EMF",
    description: "Diversified equity exposure in Nigerian listed equities with potential for price appreciation and annual dividends.",
    icon: TrendingUp,
    ytdReturn: "Price Appreciation",
    riskLevel: "Medium",
    minInvestment: 10000,
    minRecurring: 1000,
    minTenor: "N/A",
    maxTenor: "Open-ended",
    returnsType: "Price Appreciation/Annual dividends",
    color: "text-chart-1",
    details: {
      "Frequency": "Weekly",
      "Returns Type": "Price Appreciation/Annual dividends",
      "Risk Level": "Medium",
    },
  },
  {
    id: "money-market-fund",
    name: "Money Market Fund",
    shortName: "MMF",
    description: "Low-risk investment in high-quality money market instruments. Ideal for short-term capital preservation with competitive yields.",
    icon: Shield,
    ytdReturn: "15.34% p.a",
    riskLevel: "Low",
    minInvestment: 10000,
    minRecurring: 1000,
    minTenor: "30 Days",
    maxTenor: "365 Days",
    returnsType: "Quarterly",
    color: "text-success",
    details: {
      "Effective Yield": "15.34%",
      "Minimum Tenor": "30 Days",
      "Maximum Tenor": "365 Days",
      "Returns Type": "Quarterly",
      "Risk Level": "Low",
    },
  },
  {
    id: "fixed-term-portfolio",
    name: "Fixed Term Investment Portfolio",
    shortName: "FTIP",
    description: "Fixed income investment with guaranteed returns at maturity. Rates vary by tenor for flexible capital planning.",
    icon: Lock,
    ytdReturn: "10.75% - 16.39%",
    riskLevel: "Low",
    minInvestment: 200000,
    minRecurring: 1000,
    minTenor: "30 Days",
    maxTenor: "365 Days",
    returnsType: "End of tenor",
    color: "text-warning",
    details: {
      "Rate of Return": "10.75% - 16.39%",
      "Penalty on Interest": "20%",
      "Minimum Tenor": "30 Days",
      "Maximum Tenor": "365 Days",
      "Returns Type": "End of tenor",
      "Risk Level": "Low",
    },
  },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(n);
}

function ProductCard({ product }: { product: Product }) {
  const riskColors: Record<string, string> = {
    Low: "border-success/30 text-success bg-success/5",
    Medium: "border-warning/30 text-warning bg-warning/5",
    High: "border-destructive/30 text-destructive bg-destructive/5",
  };

  return (
    <Link href={`/invest/${product.id}`}>
      <Card
        className="hover:border-primary/40 transition-all cursor-pointer group hover:shadow-lg"
        data-testid={`card-product-${product.id}`}
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2.5 rounded-lg bg-muted ${product.color}`}>
              <product.icon className="w-5 h-5" />
            </div>
            <Badge variant="outline" className={`text-xs ${riskColors[product.riskLevel]}`}>
              {product.riskLevel} Risk
            </Badge>
          </div>
          <h3 className="font-semibold text-base mb-1">{product.name}</h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{product.description}</p>
          <Separator className="my-3" />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">YTD Return</span>
              <span className="font-mono font-medium text-success">{product.ytdReturn}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Min Investment</span>
              <span className="font-mono">{formatCurrency(product.minInvestment)}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Returns</span>
              <span className="text-xs">{product.returnsType}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Tenor</span>
              <span className="text-xs">{product.minTenor} - {product.maxTenor}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            View details <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ProductDetail({ product }: { product: Product }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [units, setUnits] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [recurringUnits, setRecurringUnits] = useState("");
  const [dividendAction, setDividendAction] = useState("reinvest");
  const [agreed, setAgreed] = useState(false);
  const [tenor, setTenor] = useState("");

  const isEquity = product.id === "equity-market-fund";
  const isFixed = product.id === "fixed-term-portfolio";

  const bidPrice = 43.371872;
  const offerPrice = 43.59;
  const computedAmount = units ? parseFloat(units) * offerPrice : 0;

  const handleInvest = () => {
    if (!agreed) {
      toast({ title: "Please agree to the terms", variant: "destructive" });
      return;
    }
    if (isFixed && !tenor) {
      toast({ title: "Please select a tenor", variant: "destructive" });
      return;
    }
    const investAmount = isEquity ? computedAmount : parseFloat(amount) || 0;
    if (investAmount < product.minInvestment) {
      toast({
        title: "Amount too low",
        description: `Minimum investment is ${formatCurrency(product.minInvestment)}`,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Investment submitted",
      description: `${formatCurrency(investAmount)} invested in ${product.name}. Your order is being processed.`,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl" data-testid="product-detail-page">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/invest">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg bg-muted ${product.color}`}>
          <product.icon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-sm text-muted-foreground">{product.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Investment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(product.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2.5 border-b last:border-0">
                    <span className="text-sm text-muted-foreground">{key}</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2.5 border-b">
                  <span className="text-sm text-muted-foreground">Minimum Investment</span>
                  <span className="text-sm font-medium font-mono">{formatCurrency(product.minInvestment)}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-muted-foreground">Minimum Recurring Amount</span>
                  <span className="text-sm font-medium font-mono">{formatCurrency(product.minRecurring)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Review your investment details before proceeding.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEquity ? (
                <>
                  <div className="space-y-2">
                    <Label>Number of Units</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 300000"
                      value={units}
                      onChange={(e) => setUnits(e.target.value)}
                      data-testid="input-units"
                    />
                    {units && (
                      <p className="text-xs text-muted-foreground">
                        Investment Amount: <span className="font-mono font-medium text-foreground">{formatCurrency(computedAmount)}</span>
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-muted">
                      <span className="text-xs text-muted-foreground block">Bid</span>
                      <span className="font-mono font-medium">{bidPrice}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-muted">
                      <span className="text-xs text-muted-foreground block">Offer</span>
                      <span className="font-mono font-medium">{offerPrice}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger data-testid="select-frequency"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Recurring Units</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 60000"
                      value={recurringUnits}
                      onChange={(e) => setRecurringUnits(e.target.value)}
                      data-testid="input-recurring-units"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>What would you like us to do with your dividends?</Label>
                    <RadioGroup value={dividendAction} onValueChange={setDividendAction} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="reinvest" id="reinvest" />
                        <Label htmlFor="reinvest" className="font-normal">Reinvest</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="payout" id="payout" />
                        <Label htmlFor="payout" className="font-normal">Payout</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground">
                    Processing fee: <span className="font-medium text-foreground">0% of principal.</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Investment Amount</Label>
                    <Input
                      type="number"
                      placeholder={`Min ${formatCurrency(product.minInvestment)}`}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      data-testid="input-amount"
                    />
                    {amount && parseFloat(amount) < product.minInvestment && (
                      <p className="text-xs text-destructive">
                        Minimum investment is {formatCurrency(product.minInvestment)}
                      </p>
                    )}
                  </div>
                  {isFixed && (
                    <div className="space-y-2">
                      <Label>Tenor</Label>
                      <Select value={tenor} onValueChange={setTenor}>
                        <SelectTrigger data-testid="select-tenor"><SelectValue placeholder="Select tenor" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 Days</SelectItem>
                          <SelectItem value="60">60 Days</SelectItem>
                          <SelectItem value="90">90 Days</SelectItem>
                          <SelectItem value="180">180 Days</SelectItem>
                          <SelectItem value="365">365 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Recurring Amount (optional)</Label>
                    <Input
                      type="number"
                      placeholder={`Min ${formatCurrency(product.minRecurring)}`}
                      value={recurringUnits}
                      onChange={(e) => setRecurringUnits(e.target.value)}
                      data-testid="input-recurring"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(!!v)}
                  data-testid="checkbox-terms"
                />
                <Label htmlFor="terms" className="text-xs text-muted-foreground font-normal leading-snug">
                  By ticking the box, you agree to our Terms of use and Privacy policy
                </Label>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleInvest}
                disabled={!agreed}
                data-testid="button-invest"
              >
                <PiggyBank className="w-4 h-4 mr-2" />
                Invest Now
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6 space-y-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Summary</div>
              <div>
                <span className="text-xs text-muted-foreground block">Product</span>
                <span className="font-medium">{product.name}</span>
              </div>
              {isEquity && units && (
                <>
                  <div>
                    <span className="text-xs text-muted-foreground block">Investment Amount</span>
                    <span className="font-mono font-medium text-lg">{formatCurrency(computedAmount)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Units</span>
                    <span className="font-mono">{parseInt(units).toLocaleString()}</span>
                  </div>
                </>
              )}
              {!isEquity && amount && (
                <div>
                  <span className="text-xs text-muted-foreground block">Investment Amount</span>
                  <span className="font-mono font-medium text-lg">{formatCurrency(parseFloat(amount))}</span>
                </div>
              )}
              {isFixed && tenor && (
                <div>
                  <span className="text-xs text-muted-foreground block">Tenor</span>
                  <span className="font-mono font-medium">{tenor} Days</span>
                </div>
              )}
              <div>
                <span className="text-xs text-muted-foreground block">Start Date</span>
                <span className="text-sm">
                  {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Risk Level</span>
                <Badge
                  variant="outline"
                  className={
                    product.riskLevel === "Low"
                      ? "border-success/30 text-success"
                      : product.riskLevel === "Medium"
                        ? "border-warning/30 text-warning"
                        : "border-destructive/30 text-destructive"
                  }
                >
                  {product.riskLevel}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {product.id === "money-market-fund" && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Quick Guide
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Money Market Fund invests in high-quality, short-term instruments like treasury bills, 
                  commercial papers, and bankers' acceptances. Returns are paid quarterly and the 
                  effective yield is currently 15.34% p.a.
                </p>
              </CardContent>
            </Card>
          )}
          {product.id === "fixed-term-portfolio" && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Quick Guide
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Fixed Term Investment Portfolio locks your funds for a chosen tenor at a 
                  guaranteed rate. Returns are paid at the end of tenor. Early withdrawal 
                  incurs a 20% penalty on accrued interest.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvestPage() {
  const [, params] = useRoute("/invest/:productId");
  const productId = params?.productId;

  if (productId) {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) {
      return (
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Product not found</p>
          <Link href="/invest">
            <Button variant="outline" className="mt-4">Back to products</Button>
          </Link>
        </div>
      );
    }
    return <ProductDetail product={product} />;
  }

  return (
    <div className="p-6 space-y-6" data-testid="invest-page">
      <div>
        <h1 className="text-2xl font-bold">Invest</h1>
        <p className="text-sm text-muted-foreground">Choose an investment product to get started</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
