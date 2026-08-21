# Phase 3 provider note

Initial provider integration targets NGN Market (`https://api.ngnmarket.com/v1`) because its current developer API exposes NGX-listed companies, market snapshots, company profiles, dividends, disclosures and financial data via REST with server-side Bearer-token authentication.

The adapter is isolated behind `src/lib/ngn-market-client.ts` so another licensed feed can replace or supplement it without changing Investment Desk portfolio logic.

Production deployment should verify the selected data plan, redistribution rights, refresh cadence, SLA and field coverage before relying on the feed for automated investment decisions.
