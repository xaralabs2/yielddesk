import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getAuthToken } from "@/lib/api-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatNgn } from "./helpers";
import type { ParsedTransaction } from "./types";

export function PdfUploadDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
  const [parsing, setParsing] = useState(false);
  const [pillar, setPillar] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Please select a PDF file", variant: "destructive" });
      return;
    }
    setFileName(file.name);
    setParsing(true);
    setParsed(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = getAuthToken();
      const apiBase = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiBase}/api/portfolio/parse-pdf`, {
        method: "POST",
        body: formData,
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Parse failed");
      }
      const data: ParsedTransaction = await res.json();
      setParsed(data);
    } catch (err: any) {
      toast({ title: err.message || "Failed to parse PDF", variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!parsed || !pillar) return;
      return apiRequest("POST", "/api/portfolio/holdings", {
        asset: parsed.security,
        ticker: parsed.ticker,
        pillar,
        valueNgn: parsed.totalAmount,
        shares: parsed.quantity,
        entryValueNgn: parsed.totalAmount,
      });
    },
    onSuccess: async (res) => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      let msg = "Holding added from contract note";
      try {
        const data = await res?.json();
        if (data?.merged) {
          msg = `Merged: ${data.addedShares?.toLocaleString()} shares added to existing ${data.previousShares?.toLocaleString()} (total: ${data.shares?.toLocaleString()})`;
        }
      } catch {}
      toast({ title: msg });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to add holding", variant: "destructive" });
    },
  });

  const isValid = parsed && pillar;

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => fileRef.current?.click()}
        data-testid="dropzone-pdf-upload"
      >
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} data-testid="input-pdf-file" />
        {parsing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Parsing contract note...</p>
          </div>
        ) : fileName ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <p className="text-sm text-foreground font-medium">{fileName}</p>
            <p className="text-xs text-muted-foreground">Click to select a different file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-foreground font-medium">Upload Broker Contract Note</p>
            <p className="text-xs text-muted-foreground">Supports Meristem, Stanbic IBTC, CSL, and other NGX broker PDFs</p>
          </div>
        )}
      </div>

      {parsed && (
        <Card data-testid="card-parsed-preview">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-semibold text-foreground">Parsed Successfully</span>
              <Badge variant="secondary" className="text-[9px] uppercase ml-auto">{parsed.type}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <span className="text-muted-foreground">Security</span>
                <p className="font-medium text-foreground" data-testid="text-parsed-security">{parsed.security}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Quantity</span>
                <p className="font-mono tabular-nums text-foreground" data-testid="text-parsed-quantity">{parsed.quantity.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cost Price / Share</span>
                <p className="font-mono tabular-nums text-foreground" data-testid="text-parsed-price">{formatNgn(parsed.price)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total Contract Value</span>
                <p className="font-mono tabular-nums text-foreground font-semibold" data-testid="text-parsed-total">{formatNgn(parsed.totalAmount)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Trade Date</span>
                <p className="text-foreground" data-testid="text-parsed-date">{parsed.tradeDate}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Broker</span>
                <p className="text-foreground" data-testid="text-parsed-broker">{parsed.broker}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Fees & Commission</span>
                <p className="font-mono tabular-nums text-foreground">{formatNgn(parsed.fees)}</p>
              </div>
            </div>
            <div className="border-t border-border/50 pt-3 space-y-2">
              <Label className="text-xs">Assign Wealth Pillar</Label>
              <Select value={pillar} onValueChange={setPillar}>
                <SelectTrigger data-testid="select-pdf-pillar"><SelectValue placeholder="Select pillar for this holding" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STABILITY">Stability (Cash / MMF / Short duration)</SelectItem>
                  <SelectItem value="INFLATION">Inflation Hedge (Banks / Cement / Equities)</SelectItem>
                  <SelectItem value="STRATEGIC">Strategic (Property / SPVs / Private deals)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => addMutation.mutate()} disabled={!isValid || addMutation.isPending} data-testid="button-confirm-pdf-holding">
              {addMutation.isPending ? "Adding..." : `Add ${parsed.security} to Portfolio`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
