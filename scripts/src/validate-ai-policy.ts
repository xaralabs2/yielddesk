import { enforceYieldDeskAiPolicy } from "../../artifacts/api-server/src/lib/ai-policy";

if (typeof enforceYieldDeskAiPolicy !== "function") {
  throw new Error("YieldDesk AI policy function is unavailable");
}

const blocked = [
  "Buy ACME now.",
  "I recommend ACME.",
  "ACME is the best choice for you.",
  "Consider buying ACME.",
  "You should allocate 40% to ACME.",
  "HOLD: ACME",
  "The preferred entry is $100.",
];

const allowed = [
  "ACME has a stated yield of 4% according to the supplied observation.",
  "This hypothetical result uses the user's stated inflation assumption.",
  "The two instruments differ in currency, duration, and liquidity.",
  "Buying and selling are general transaction concepts; YieldDesk does not provide instructions.",
];

for (const text of blocked) {
  const result = enforceYieldDeskAiPolicy(text);
  if (result.allowed) throw new Error(`Expected policy to block: ${text}`);
}

for (const text of allowed) {
  const result = enforceYieldDeskAiPolicy(text);
  if (!result.allowed) throw new Error(`Expected policy to allow: ${text} (${result.reason})`);
}

console.log(`AI policy validation passed: ${blocked.length} blocked, ${allowed.length} allowed`);

