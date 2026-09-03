---
name: Replit pnpm publish bootstrap
description: Replit artifact publishing can abort before builds when the root manifest pins an exact pnpm packageManager version.
---

Do not add an exact root `packageManager: "pnpm@..."` pin unless a current Replit publish confirms it is supported.

**Why:** A publish attempted to bootstrap the pinned pnpm version by repeatedly running `pnpm add pnpm@...`, then aborted before any TypeScript or artifact build ran.

**How to apply:** When publish logs repeat a pnpm self-install command and end in SIGABRT or exit 1, remove the root package-manager pin, restore dependencies from the lockfile, and verify the full root build plus artifact startup.