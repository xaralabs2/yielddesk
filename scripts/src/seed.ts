import { db, usersTable, holdingsTable, dealsTable, signalsTable, alertsTable } from "@workspace/db";
import bcrypt from "bcrypt";

async function seed() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 10);

  const [user] = await db.insert(usersTable).values({
    email: "demo@yielddesk.com",
    passwordHash,
    role: "user",
  }).returning();

  const [admin] = await db.insert(usersTable).values({
    email: "admin@yielddesk.com",
    passwordHash,
    role: "admin",
  }).returning();

  console.log(`Created users: ${user.email}, ${admin.email}`);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const oneEightyDaysFromNow = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

  await db.insert(holdingsTable).values([
    {
      userId: user.id,
      type: "CP",
      amount: 5000000,
      rate: 19.5,
      issuer: "Access Bank",
      startDate: thirtyDaysAgo,
      maturityDate: fiveDaysFromNow,
      status: "ACTIVE",
    },
    {
      userId: user.id,
      type: "BOND",
      amount: 10000000,
      rate: 17.2,
      issuer: "FGN",
      startDate: thirtyDaysAgo,
      maturityDate: oneEightyDaysFromNow,
      status: "ACTIVE",
    },
    {
      userId: user.id,
      type: "MMMF",
      amount: 3000000,
      rate: 12.5,
      issuer: "Stanbic IBTC",
      startDate: thirtyDaysAgo,
      maturityDate: null,
      status: "ACTIVE",
    },
  ]);

  console.log("Created holdings");

  await db.insert(dealsTable).values([
    {
      issuer: "GTBank",
      rate: 20.5,
      tenorDays: 90,
      minAmount: 1000000,
      riskLevel: "LOW",
    },
    {
      issuer: "Zenith Bank",
      rate: 19.0,
      tenorDays: 180,
      minAmount: 5000000,
      riskLevel: "LOW",
    },
    {
      issuer: "First Bank",
      rate: 22.0,
      tenorDays: 60,
      minAmount: 2000000,
      riskLevel: "MEDIUM",
    },
  ]);

  console.log("Created deals");

  await db.insert(signalsTable).values([
    { cpRate: 18.5, bondYield: 16.8 },
    { cpRate: 19.2, bondYield: 17.1 },
    { cpRate: 20.0, bondYield: 17.5 },
  ]);

  console.log("Created signals");

  await db.insert(alertsTable).values([
    {
      userId: user.id,
      type: "MARKET",
      message: "CP rate has exceeded 18% threshold — consider investing in commercial paper",
      read: false,
    },
    {
      userId: user.id,
      type: "PORTFOLIO",
      message: "Access Bank CP holding matures in 5 days — plan reallocation",
      read: false,
    },
    {
      userId: user.id,
      type: "SYSTEM",
      message: "Idle cash detected: 3,000,000 in MMMF could be deployed at higher yield",
      read: true,
    },
  ]);

  console.log("Created alerts");
  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
