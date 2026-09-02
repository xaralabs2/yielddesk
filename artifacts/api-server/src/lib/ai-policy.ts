const prohibitedPatterns: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\b(strong\s+buy|buy|sell|hold|accumulate|avoid)\b\s*[:\-–—]/i, reason: "decision label" },
  { pattern: /\b(you|investor)\s+(should|must|need(?:s)?\s+to)\s+(buy|sell|hold|invest|allocate|choose|use)\b/i, reason: "personal instruction" },
  { pattern: /\b(recommended|suitable|best)\s+(for\s+you|investment|broker|provider|allocation)\b/i, reason: "recommendation or suitability claim" },
  { pattern: /\b(target|recommended)\s+allocation\b/i, reason: "prescribed allocation" },
  { pattern: /\b(preferred|ideal)\s+entry\b/i, reason: "entry instruction" },
];

export type YieldDeskAiPolicyResult =
  | { allowed: true; text: string }
  | { allowed: false; reason: string };

export function enforceYieldDeskAiPolicy(text: string): YieldDeskAiPolicyResult {
  const normalized = text.trim();
  if (!normalized) return { allowed: false, reason: "empty output" };

  for (const rule of prohibitedPatterns) {
    if (rule.pattern.test(normalized)) return { allowed: false, reason: rule.reason };
  }

  return { allowed: true, text: normalized };
}

export const YIELDDESK_AI_BOUNDARY = `
YieldDesk provides general information, education, objective comparison, and user-controlled hypothetical simulation.
Do not recommend an investment, allocation, broker, adviser, or provider.
Do not tell the user to buy, sell, hold, avoid, accumulate, invest, or enter at a particular price.
Do not determine suitability or describe anything as best or recommended for the user.
Separate sourced facts, calculations, user assumptions, historical observations, and estimates.
If information is missing or stale, say so.
Present material differences and general risks without reaching a decision for the user.
`.trim();

export async function runPolicyCheckedAi(
  generate: () => Promise<string>,
): Promise<string> {
  const output = await generate();
  const result = enforceYieldDeskAiPolicy(output);
  if (!result.allowed) {
    throw new Error(`AI_POLICY_BLOCKED: ${result.reason}`);
  }
  return result.text;
}
