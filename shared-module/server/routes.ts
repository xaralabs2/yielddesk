import type { Express, Request, Response, NextFunction } from "express";
import multer from "multer";
import type { IPortfolioStorage } from "../types";
import { computePortfolioDashboard } from "./portfolio-engine";
import { computeInvestmentLandscape } from "./investment-data";
import { computeEtfAllocation } from "./etf-engine";
import { resolveNgxTicker, resolveNgxTickerSync } from "./stock-prices";
import { parseBrokerPdf } from "./pdf-parser";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => void;
type GetUserId = (req: Request) => string;

export function registerInvestmentPortfolioRoutes(
  app: Express,
  storage: IPortfolioStorage,
  isAuthenticated: AuthMiddleware,
  getUserId: GetUserId
) {
  app.get("/api/investments", async (_req, res) => {
    try {
      const latest = await storage.getLatestMacroData();
      if (!latest) {
        return res.status(404).json({ message: "No macro data available" });
      }
      const data = computeInvestmentLandscape(latest);
      return res.json(data);
    } catch (error) {
      console.error("Investments API error:", error);
      return res.status(500).json({ message: "Failed to fetch investment data" });
    }
  });

  app.get("/api/etf/allocation", async (_req, res) => {
    try {
      const latest = await storage.getLatestMacroData();
      if (!latest) {
        return res.status(404).json({ message: "No macro data available" });
      }
      const data = computeEtfAllocation(latest);
      return res.json(data);
    } catch (error) {
      console.error("ETF allocation API error:", error);
      return res.status(500).json({ message: "Failed to compute ETF allocation" });
    }
  });

  app.get("/api/portfolio", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const [holdings, config, latestMacro] = await Promise.all([
        storage.getPortfolioHoldings(userId),
        storage.getPortfolioConfig(userId),
        storage.getLatestMacroData(),
      ]);
      const dashboard = await computePortfolioDashboard(holdings, config, latestMacro);
      return res.json(dashboard);
    } catch (error) {
      console.error("Portfolio API error:", error);
      return res.status(500).json({ message: "Failed to fetch portfolio data" });
    }
  });

  app.post("/api/portfolio/holdings", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { asset, ticker, pillar, valueNgn, shares, annualRentNgn, corridor, entryDate, entryValueNgn } = req.body;
      if (!asset || !pillar || valueNgn == null) {
        return res.status(400).json({ message: "asset, pillar, and valueNgn are required" });
      }
      if (!["STABILITY", "INFLATION", "STRATEGIC"].includes(pillar)) {
        return res.status(400).json({ message: "pillar must be STABILITY, INFLATION, or STRATEGIC" });
      }
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
        console.log(`[NGX verify] "${ticker || asset}" → ${ngxMatch.symbol} (${ngxMatch.name}), price ₦${ngxMatch.price.toFixed(2)}`);
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
          const holding = await storage.updatePortfolioHolding(match.id, userId, {
            ticker: resolvedTicker,
            shares: totalShares,
            valueNgn: totalShares * avgPrice,
            entryValueNgn: totalCost,
            lastUpdated: new Date(),
          });
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

  app.patch("/api/portfolio/holdings/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const { asset, ticker, pillar, valueNgn, shares, annualRentNgn, corridor, entryDate } = req.body;
      const validCorridors = ["Lekki Phase 1", "Ibeju Lekki", "Victoria Island", "Ikoyi", "Eko Atlantic", "Other"];
      const updates: Record<string, unknown> = { lastUpdated: new Date() };
      if (asset != null) updates.asset = asset;
      if (ticker !== undefined) updates.ticker = ticker;
      if (pillar != null) {
        if (!["STABILITY", "INFLATION", "STRATEGIC"].includes(pillar)) {
          return res.status(400).json({ message: "pillar must be STABILITY, INFLATION, or STRATEGIC" });
        }
        updates.pillar = pillar;
      }
      if (valueNgn != null) updates.valueNgn = Number(valueNgn);
      if (shares !== undefined) updates.shares = shares != null ? Number(shares) : null;
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

  app.delete("/api/portfolio/holdings/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      await storage.deletePortfolioHolding(id, userId);
      return res.json({ success: true });
    } catch (error) {
      console.error("Delete holding error:", error);
      return res.status(500).json({ message: "Failed to delete holding" });
    }
  });

  app.post("/api/portfolio/config", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { baselineValue, targetValue, stabilityTarget, inflationTarget, strategicTarget, tolerance, availableCash } = req.body;
      if (baselineValue == null) {
        return res.status(400).json({ message: "baselineValue is required" });
      }
      const config = await storage.upsertPortfolioConfig({
        userId,
        baselineValue: Number(baselineValue),
        targetValue: Number(targetValue ?? 0),
        stabilityTarget: Number(stabilityTarget ?? 0.10),
        inflationTarget: Number(inflationTarget ?? 0.15),
        strategicTarget: Number(strategicTarget ?? 0.75),
        tolerance: Number(tolerance ?? 0.05),
        availableCash: Number(availableCash ?? 0),
      });
      return res.json(config);
    } catch (error) {
      console.error("Config update error:", error);
      return res.status(500).json({ message: "Failed to update config" });
    }
  });

  app.post("/api/portfolio/parse-pdf", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({ message: "File must be a PDF" });
      }
      const parsed = await parseBrokerPdf(req.file.buffer);
      return res.json(parsed);
    } catch (error: any) {
      console.error("PDF parse error:", error);
      const msg = error?.message || "";
      if (msg.includes("Invalid PDF") || msg.includes("InvalidPDF") || msg.includes("stream must have data")) {
        return res.status(400).json({ message: "Invalid PDF file. Please upload a valid broker contract note PDF." });
      }
      return res.status(400).json({ message: "Failed to parse PDF. Please check the document format." });
    }
  });
}
