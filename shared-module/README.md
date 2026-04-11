# SoliDeo Shared Module — Investments & Portfolio

Reusable module extracted from SoliDeo MacroLens. Contains the **Investments** page and **Portfolio** page with all backend dependencies.

## Contents

```
shared-module/
├── types/              # TypeScript types (standalone, no Drizzle dependency)
│   └── index.ts
├── server/             # Backend engines + API route registrar
│   ├── stock-prices.ts     # NGX live data feed, ticker resolution, TICKER_ALIASES
│   ├── pdf-parser.ts       # Broker contract note PDF extraction
│   ├── portfolio-engine.ts # Portfolio valuation with live NGX prices
│   ├── investment-data.ts  # Investment landscape computation
│   └── routes.ts           # Express route registrar (plug into your app)
├── client/             # Frontend pages (React + shadcn + TanStack Query)
│   ├── investments.tsx     # Investments landscape page
│   └── portfolio.tsx       # Portfolio dashboard page
└── README.md
```

## Integration into your Replit app

### 1. Copy files
Copy `shared-module/` into your project root.

### 2. Install dependencies (if not already present)
```bash
npm install pdf-parse multer
npm install -D @types/multer
```

### 3. Types
The `types/index.ts` file contains standalone TypeScript types with no ORM dependency.
Map them to your own database schema/storage layer.

### 4. Backend
In your Express app, register the routes:

```typescript
import { registerInvestmentPortfolioRoutes } from "./shared-module/server/routes";

registerInvestmentPortfolioRoutes(app, storage, isAuthenticated, getUserId);
```

Your `storage` object must implement the `IPortfolioStorage` interface exported from `types/index.ts`.

### 5. Frontend
Add to your router:

```tsx
import InvestmentsPage from "./shared-module/client/investments";
import PortfolioPage from "./shared-module/client/portfolio";

<Route path="/investments" component={InvestmentsPage} />
<Route path="/portfolio" component={PortfolioPage} />
```

Add to your sidebar/nav:

```tsx
{ title: "Investments", url: "/investments", icon: CircleDollarSign },
{ title: "Portfolio", url: "/portfolio", icon: Wallet },
```

### 6. Environment
- NGX data feed is public (no API key needed)
- PDF parsing uses `pdf-parse` (no external API)
- Frontend expects these API endpoints to exist:
  - `GET /api/investments`
  - `GET /api/portfolio`
  - `POST /api/portfolio/holdings`
  - `PATCH /api/portfolio/holdings/:id`
  - `DELETE /api/portfolio/holdings/:id`
  - `POST /api/portfolio/config`
  - `POST /api/portfolio/parse-pdf`

## Key Design Rules

- **Current Price**: Only from NGX live feed. Never guessed or calculated.
- **Cost Price**: From manual input (shares × cost/share) or PDF broker contract note.
- **Financial precision**: Always `.toFixed(2)` minimum. Never `.toFixed(1)` or `.toFixed(0)`.
- **NGN primary**: All values in Nigerian Naira. USD is secondary reference only.
- **TICKER_ALIASES**: Hardcoded map resolves corporate rebranding (e.g. ACCESS BANK → ACCESSCORP).
