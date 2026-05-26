/**
 * Close the loop. `pnpm new-demo <DEMO_ID>`
 *
 * Builder export → DemoSpec → synthesize corpus → (index if needed) → ready.
 * The single button BlueAlly presses per client.
 *
 * - semantic_search: synthesizes a corpus and indexes it into pgvector.
 * - validate / extract / others: synthesizes the DATA into lib/generated/<id>.json.
 *   The deterministic rules / conflict logic stay as authored code (they're
 *   domain logic, not data) — wire them in the matching *-seed.ts.
 */
import { execSync } from "node:child_process";
import { getDemo } from "../lib/demos.js";

const id = process.argv[2] ?? "UC-01";
const spec = getDemo(id);
const sh = (cmd: string) => execSync(cmd, { stdio: "inherit" });

console.log(`\n> building demo ${spec.id} — ${spec.customer} (${spec.archetype})\n`);

sh(`tsx --env-file=.env scripts/synthesize-corpus.ts ${spec.id}`);

if (spec.archetype === "semantic_search") {
  console.log(`\n> indexing into pgvector...\n`);
  sh(`tsx --env-file=.env scripts/ingest.ts ${spec.id}`);
  console.log(`\n> ready. set ACTIVE_DEMO_ID="${spec.id}" (or pick it in the switcher) and pnpm dev.\n`);
} else {
  console.log(
    `\n> corpus written to lib/generated/${spec.id}.json. No DB needed for ${spec.archetype}.\n` +
      `  Rules/conflict logic stay in code — confirm the matching seed module is wired.\n` +
      `  Then pick ${spec.id} in the switcher and pnpm dev.\n`,
  );
}
