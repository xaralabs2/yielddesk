import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
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

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",").map(s => s.trim())
  : undefined;

app.use(cors(
  allowedOrigins
    ? {
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        credentials: true,
      }
    : {
        origin: true,
        credentials: true,
      }
));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later" },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI rate limit exceeded, please wait a moment" },
});
app.use("/api/ai", aiLimiter);

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

app.use(express.json({ limit: "1mb" }));
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
