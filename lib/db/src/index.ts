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

const encodedCa = process.env.DATABASE_CA_CERT_BASE64;
let pool: InstanceType<typeof Pool>;

if (encodedCa) {
  const connectionUrl = new URL(databaseUrl);
  connectionUrl.searchParams.delete("sslmode");
  pool = new Pool({
    connectionString: connectionUrl.toString(),
    ssl: {
      ca: Buffer.from(encodedCa, "base64").toString("utf8"),
      rejectUnauthorized: true,
    },
  });
} else {
  pool = new Pool({ connectionString: databaseUrl });
}

export { pool };
export const db = drizzle(pool, { schema });

export * from "./schema";
