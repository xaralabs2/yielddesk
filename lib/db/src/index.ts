import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

function databasePoolConfig(): pg.PoolConfig {
  const encodedCa = process.env.DATABASE_CA_CERT_BASE64;
  if (!encodedCa) {
    return { connectionString: databaseUrl };
  }

  const connectionUrl = new URL(databaseUrl);
  connectionUrl.searchParams.delete("sslmode");

  return {
    connectionString: connectionUrl.toString(),
    ssl: {
      ca: Buffer.from(encodedCa, "base64").toString("utf8"),
      rejectUnauthorized: true,
    },
  };
}

export const pool = new Pool(databasePoolConfig());
export const db = drizzle(pool, { schema });

export * from "./schema";
