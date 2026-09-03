# Agent Instructions

Read and follow `AUTONOMY.md` before making changes to this repository.

`AUTONOMY.md` defines the standing execution authority, escalation boundaries, merge policy, safety requirements, and continuation rules for autonomous engineering work.

Repository-specific instructions in this file supplement `AUTONOMY.md`; they do not weaken its production, financial, security, legal, or IP boundaries.

## Xara organization-wide Agent Skills

This repository participates in the Xara-wide agent operating system. Before material work:

1. Read local `AUTONOMY.md`, this `AGENTS.md`, and any repository-specific rules, decisions, constitutions, runbooks, or environment documents.
2. Inspect the central catalog at `xaralabs2/xara-code-os/.agents/skills/CATALOG.md` and load only the skills relevant to the requested operation.
3. Treat the central skills as discovery and routing entry points. Local canonical product and architecture sources remain authoritative for this repository.

Relevant triggers include: routine engineering authority (`xara-autonomous-engineering`); approved decision preservation (`preserve-canonical-decisions`); credentials or access (`handle-secrets-and-access`); environment resolution (`discover-xara-environments`); releases and deployment evidence (`release-with-evidence`); database work (`operate-databases-safely`); material UI work (`review-user-experience`); and Factory operations (`operate-xara-ai-factory`).

A skill never expands execution authority. Preserve the stricter safety boundary when sources differ, reconcile chronology and explicit human decisions, and never claim a source was read unless its exact current content was inspected. The central catalog is introduced by `xara-code-os` PR #36; until it is merged, treat that PR as the catalog source of record.
