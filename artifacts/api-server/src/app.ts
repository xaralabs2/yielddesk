import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { eq } from "drizzle-orm";
import router from "./routes";
import { logger } from "./lib/logger";
import { requireAuth } from "./middlewares/auth";
import { registerInvestmentPortfolioRoutes } from "../../../shared-module/server/routes";
import { portfolioStorage } from "./lib/portfolio-storage";
import { db, holdingsTable } from "@workspace/db";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

async function fetchUserHoldings(userId: string) {
  const rows = await db
    .select()
    .from(holdingsTable)
    .where(eq(holdingsTable.userId, parseInt(userId)));
  return rows as any[];
}

registerInvestmentPortfolioRoutes(
  app,
  portfolioStorage,
  requireAuth as (req: Request, res: Response, next: NextFunction) => void,
  (req: Request) => String((req as any).user?.userId ?? "0"),
  fetchUserHoldings,
);

export default app;
