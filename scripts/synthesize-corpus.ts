/**
 * Universal data adapter. `pnpm tsx --env-file=.env scripts/synthesize-corpus.ts <DEMO_ID>`
 *
 * This is what makes the engine work for ANY industry without sourcing real
 * data. Given a DemoSpec, Claude fabricates a realistic dummy corpus in the
 * shape the archetype expects (the corpusShape contract). Aquarium protocols,
 * manufacturing lots, leases, media beats — same call, different domain.
 *
 * Writes lib/generated/<id>.json, which the archetype's ingest step then loads.
 * For a quality upgrade on a specific domain, replace this with an open-data
 * adapter (Internet Archive, data.gov, HuggingFace datasets) emitting the same JSON.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { getDemo } from "../lib/demos.js";
import { ARCHETYPES } from "../lib/archetypes.js";

// Fallback chain so we work in sandboxes that redact ANTHROPIC_API_KEY by name.
const apiKey =
  process.env.ANTHROPIC_API_KEY ||
  process.env.AI_PROVIDER_KEY ||
  process.env.CLAUDE_KEY;
if (!apiKey) {
  console.error("Missing API key. Set ANTHROPIC_API_KEY, AI_PROVIDER_KEY, or CLAUDE_KEY.");
  process.exit(1);
}
const anthropic = createAnthropic({ apiKey });
const model = anthropic(process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5");

async function main() {
  const id = process.argv[2] ?? "UC-01";
  const spec = getDemo(id);
  const archetype = ARCHETYPES[spec.archetype];

  console.log(`> synthesizing corpus for ${spec.id} (${spec.customer}, ${spec.archetype})`);

  const { text } = await generateText({
    model,
    maxTokens: 16000,
    prompt:
      `You are generating a realistic but entirely fictional demo dataset.\n\n` +
      `Domain: ${spec.domain}\n` +
      `Archetype: ${archetype.label}\n` +
      `Required shape: ${archetype.corpusShape}\n\n` +
      `Return ONLY valid JSON (no prose, no markdown fences): an array of 12 to 18 records ` +
      `matching the shape. Make the content domain-authentic and varied — include ` +
      `realistic edge cases (errors, conflicts, restricted/expired items) so the ` +
      `demo's filtering and human-in-the-loop steps visibly do something. Keep each ` +
      `record concise so the total response fits well under your output budget.`,
  });

  // Robust extraction: prefer fenced code block, fall back to first [..] or {..}.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const arrayMatch = raw.match(/\[[\s\S]*\]/);
  const objectMatch = raw.match(/\{[\s\S]*\}/);
  const json = (arrayMatch?.[0] ?? objectMatch?.[0] ?? raw).trim();
  const data = JSON.parse(json);

  mkdirSync("lib/generated", { recursive: true });
  const path = `lib/generated/${spec.id}.json`;
  writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(`> wrote ${Array.isArray(data) ? data.length : "?"} records to ${path}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Synthesis failed (rerun — model occasionally emits stray prose):", e.message);
  process.exit(1);
});
