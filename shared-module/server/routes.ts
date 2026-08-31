import type { IPortfolioStorage } from "../types";
import { computePortfolioDashboard } from "./portfolio-engine";
import { computeInvestmentLandscape } from "./investment-data";
import { computeEtfAllocation } from "./etf-engine";
import { resolveNgxTicker, resolveNgxTickerSync } from "./stock-prices";
import { parseBrokerPdf } from "./pdf-parser";

type RequestLike = {
  body: any;
  params: Record<string, string>;
  file?: { mimetype: string; buffer: Buffer };
};

type ResponseLike = {
  status(code: number): ResponseLike;
  json(body: any): any;
};

type NextFunctionLike = () => void;

type ExpressLike = {
  get(path: string, ...handlers: any[]): any;
  post(path: string, ...handlers: any[]): any;
  patch(path: string, ...handlers: any[]): any;
  delete(path: string, ...handlers: any[]): any;
};

type AuthMiddleware = (req: RequestLike, res: ResponseLike, next: NextFunctionLike) => void;
type GetUserId = (req: RequestLike) => string;
type UploadSingleMiddleware = (req: RequestLike, res: ResponseLike, next: NextFunctionLike) => void;

type HoldingsRecord = {
  id: number;
  userId: number | string;
  type: string;
  amount: number;
  rate: number;
  issuer: string;
  startDate: Date | null;
  maturityDate: Date | null;
  status: string;
};

type FetchHoldings = (userId: string) => Promise<HoldingsRecord[]>;

function convertHoldingToPortfolio(h: HoldingsRecord) {
  return {
    id: `holding-${h.id}`,
    userId: String(h.userId),
    asset: h.issuer,
    ticker: null,
    pillar: "STABILITY" as const,
    valueNgn: h.amount,
    shares: null,
    entryFxRate: null,
    annualRentNgn: null,
    cumulativeRentNgn: null,
    corridor: null,
    entryValueNgn: h.amount,
    entryDate: h.startDate,
    lastUpdated: h.startDate,
  };
}

export function registerInvestmentPortfolioRoutes(
  app: ExpressLike,
  storage: IPortfolioStorage,
  isAuthenticated: AuthMiddleware,
  getUserId: GetUserId,
  fetchHoldings: FetchHoldings | undefined,
  uploadSingle: UploadSingleMiddleware,
) {
  app.get("/api/investments", async (_req: RequestLike, res: ResponseLike) => {
    try {
      const latest = await storage.getLatestMacroData();
      if (!latest) return res.status(404).json({ message: "No macro data available" });
      return res.json(computeInvestmentLandscape(latest));
    } catch (error) {
      console.error("Investments API error:", error);
      return res.status(500).json({ message: "Failed to fetch investment data" });
    }
  });

  app.get("/api/etf/allocation", async (_req: RequestLike, res: ResponseLike) => {
    try {
      const latest = await storage.getLatestMacroData();
      if (!latest) return res.status(404).json({ message: "No macro data available" });
      return res.json(computeEtfAllocation(latest));
    } catch (error) {
      console.error("ETF allocation API error:", error);
      return res.status(500).json({ message: "Failed to compute ETF allocation" });
    }
  });

  app.get("/api/portfolio", isAuthenticated, async (req: RequestLike, res: ResponseLike) => {
    try {
      const userId = getUserId(req);
      const [portfolioHoldings, config, latestMacro, externalHoldings] = await Promise.all([
        storage.getPortfolioHoldings(userId),
        storage.getPortfolioConfig(userId),
        storage.getLatestMacroData(),
        fetchHoldings ? fetchHoldings(userId) : Promise.resolve([]),
      ]);
      const convertedExternal = externalHoldings.filter((h) => h.status === "ACTIVE").map(convertHoldingToPortfolio);
      return res.json(await computePortfolioDashboard([...portfolioHoldings, ...convertedExternal], config, latestMacro));
    } catch (error) {
      console.error("Portfolio API error:", error);
      return res.status(500).json({ message: "Failed to fetch portfolio data" });
    }
  });

  app.post("/api/portfolio/holdings", isAuthenticated, async (req: RequestLike, res: ResponseLike) => {
    try {
      const userId = getUserId(req);
      const { asset, ticker, pillar, valueNgn, shares, annualRentNgn, corridor, entryDate, entryValueNgn } = req.body;
      if (!asset || !pillar || valueNgn == null) return res.status(400).json({ message: "asset, pillar, and valueNgn are required" });
      if (!["STABILITY", "INFLATION", "STRATEGIC"].includes(pillar)) return res.status(400).json({ message: "pillar must be STABILITY, INFLATION, or STRATEGIC" });
      const validCorridors = ["Lekki Phase 1", "Ibeju Lekki", "Victoria Island", "Ikoyi", "Eko Atlantic", "Other"];
      let entryFxRate = null;
      if (pillar === "STRATEGIC") {
        const latestMacro = await storage.getLatestMacroData();
        entryFxRate = latestMacro?.fxRate ?? null;
      }
      let resolvedTicker = (ticker || asset).toUpperCase().trim();
      let resolvedAsset = asset;
      const ngxMatch = await resolveNgxTicker(ticker || asset);
      if (ngxMatch) {
        resolvedTicker = ngxMatch.symbol;
        if (!ticker) resolvedAsset = ngxMatch.name;
      }
      if (shares != null && pillar !== "STRATEGIC") {
        const existing = await storage.getPortfolioHoldings(userId);
        const match = existing.find(h => {
          if (h.pillar !== pillar) return false;
          const existingNgx = resolveNgxTickerSync(h.ticker || h.asset);
          const existingSymbol = existingNgx || (h.ticker || h.asset).toUpperCase().trim();
          return existingSymbol === resolvedTicker;
        });
        if (match && match.shares != null) {
          const oldShares = match.shares;
          const oldCost = match.entryValueNgn ?? match.valueNgn;
          const newShares = Number(shares);
          const newCost = entryValueNgn != null ? Number(entryValueNgn) : Number(valueNgn);
          const totalShares = oldShares + newShares;
          const totalCost = oldCost + newCost;
          const avgPrice = totalCost / totalShares;
          const holding = await storage.updatePortfolioHolding(match.id, userId, { ticker: resolvedTicker, shares: totalShares, valueNgn: totalShares * avgPrice, entryValueNgn: totalCost, lastUpdated: new Date() });
          return res.json({ ...holding, merged: true, previousShares: oldShares, addedShares: newShares });
        }
      }
      const holding = await storage.addPortfolioHolding({
        userId,
        asset: resolvedAsset,
        ticker: resolvedTicker || ticker || null,
        pillar,
        valueNgn: Number(valueNgn),
        shares: shares != null ? Number(shares) : null,
        entryFxRate,
        annualRentNgn: pillar === "STRATEGIC" && annualRentNgn != null && Number(annualRentNgn) >= 0 ? Number(annualRentNgn) : null,
        cumulativeRentNgn: 0,
        entryValueNgn: entryValueNgn != null ? Number(entryValueNgn) : Number(valueNgn),
        corridor: pillar === "STRATEGIC" && corridor && validCorridors.includes(corridor) ? String(corridor) : null,
        entryDate: pillar === "STRATEGIC" && entryDate ? new Date(entryDate) : new Date(),
        lastUpdated: new Date(),
      });
      return res.json(holding);
    } catch (error) {
      console.error("Add holding error:", error);
      return res.status(500).json({ message: "Failed to add holding" });
    }
  });

  app.patch("/api/portfolio/holdings/:id", isAuthenticated, async (req: RequestLike, res: ResponseLike) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const { asset, ticker, pillar, valueNgn, shares, annualRentNgn, corridor, entryDate, entryValueNgn } = req.body;
      const validCorridors = ["Lekki Phase 1", "Ibeju Lekki", "Victoria Island", "Ikoyi", "Eko Atlantic", "Other"];
      const updates: Record<string, unknown> = { lastUpdated: new Date() };
      if (asset != null) updates.asset = asset;
      if (ticker !== undefined) updates.ticker = ticker;
      if (pillar != null) {
        if (!["STABILITY", "INFLATION", "STRATEGIC"].includes(pillar)) return res.status(400).json({ message: "pillar must be STABILITY, INFLATION, or STRATEGIC" });
        updates.pillar = pillar;
      }
      if (valueNgn != null) {
        const v = Number(valueNgn);
        if (isNaN(v)) return res.status(400).json({ message: "valueNgn must be a valid number" });
        updates.valueNgn = v;
      }
      if (shares !== undefined) {
        if (shares != null && isNaN(Number(shares))) return res.status(400).json({ message: "shares must be a valid number" });
        updates.shares = shares != null ? Number(shares) : null;
      }
      if (entryValueNgn !== undefined) {
        if (entryValueNgn != null && isNaN(Number(entryValueNgn))) return res.status(400).json({ message: "entryValueNgn must be a valid number" });
        updates.entryValueNgn = entryValueNgn != null ? Number(entryValueNgn) : null;
      }
      if (annualRentNgn !== undefined) updates.annualRentNgn = annualRentNgn != null && Number(annualRentNgn) >= 0 ? Number(annualRentNgn) : null;
      if (corridor !== undefined) updates.corridor = corridor && validCorridors.includes(corridor) ? corridor : null;
      if (entryDate !== undefined) updates.entryDate = entryDate ? new Date(entryDate) : null;
      if (pillar === "STRATEGIC" && valueNgn != null) {
        const latestMacro = await storage.getLatestMacroData();
        updates.entryFxRate = latestMacro?.fxRate ?? null;
      }
      const holding = await storage.updatePortfolioHolding(id, userId, updates as any);
      if (!holding) return res.status(404).json({ message: "Holding not found" });
      return res.json(holding);
    } catch (error) {
      console.error("Update holding error:", error);
      return res.status(500).json({ message: "Failed to update holding" });
    }
  });

  app.delete("/api/portfolio/holdings/:id", isAuthenticated, async (req: RequestLike, res: ResponseLike) => {
    try {
      const userId = getUserId(req);
      await storage.deletePortfolioHolding(parseInt(req.params.id), userId);
      return res.json({ success: true });
    } catch (error) {
      console.error("Delete holding error:", error);
      return res.status(500).json({ message: "Failed to delete holding" });
    }
  });

  app.post("/api/portfolio/config", isAuthenticated, async (req: RequestLike, res: ResponseLike) => {
    try {
      const userId = getUserId(req);
      const { baselineValue, targetValue, stabilityTarget, inflationTarget, strategicTarget, tolerance, availableCash } = req.body;
      if (baselineValue == null) return res.status(400).json({ message: "baselineValue is required" });
      return res.json(await storage.upsertPortfolioConfig({ userId, baselineValue: Number(baselineValue), targetValue: Number(targetValue ?? 0), stabilityTarget: Number(stabilityTarget ?? 0.10), inflationTarget: Number(inflationTarget ?? 0.15), strategicTarget: Number(strategicTarget ?? 0.75), tolerance: Number(tolerance ?? 0.05), availableCash: Number(availableCash ?? 0) }));
    } catch (error) {
      console.error("Config update error:", error);
      return res.status(500).json({ message: "Failed to update config" });
    }
  });

  app.post("/api/portfolio/parse-pdf", isAuthenticated, uploadSingle, async (req: RequestLike, res: ResponseLike) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      if (req.file.mimetype !== "application/pdf") return res.status(400).json({ message: "File must be a PDF" });
      return res.json(await parseBrokerPdf(req.file.buffer));
    } catch (error: any) {
      console.error("PDF parse error:", error);
      const msg = error?.message || "";
      if (msg.includes("Invalid PDF") || msg.includes("InvalidPDF") || msg.includes("stream must have data")) return res.status(400).json({ message: "Invalid PDF file. Please upload a valid broker contract note PDF." });
      return res.status(400).json({ message: "Failed to parse PDF. Please check the document format." });
    }
  });
}
