/**
 * Ingest job. Run once: `pnpm ingest`
 *
 * Prereqs:
 *   1. In the Neon SQL editor run:  CREATE EXTENSION IF NOT EXISTS vector;
 *   2. `pnpm db:push`  (creates tables + HNSW index from lib/db/schema.ts)
 *
 * Then this loads the corpus, embeds every scene beat with the SAME embed()
 * the live query path uses, and upserts into pgvector.
 */
import { sql } from "drizzle-orm";
import { existsSync, readFileSync } from "node:fs";
import { db } from "../lib/db/index.js";
import { assets, sceneBeats, rights } from "../lib/db/schema.js";
import { embedBatch, EMBEDDINGS_PROVIDER } from "../lib/embeddings.js";
import { SEED, type SeedAsset } from "../lib/seed-data.js";

const iaUrl = (id: string) => `https://archive.org/details/${id}`;
const thumbUrl = (id: string) => `https://picsum.photos/seed/${id}/640/360`;

/** Prefer the synthesizer's output (lib/generated/<id>.json) if present and shaped
 *  like SeedAsset[]; otherwise fall back to the baked corpus. */
function loadCorpus(demoId: string): SeedAsset[] {
  const path = `lib/generated/${demoId}.json`;
  if (existsSync(path)) {
    try {
      const gen = JSON.parse(readFileSync(path, "utf8"));
      if (Array.isArray(gen) && gen[0]?.beats && gen[0]?.rights) {
        console.log(`> using synthesized corpus ${path}`);
        return gen as SeedAsset[];
      }
      console.warn(`> ${path} present but wrong shape — using baked seed`);
    } catch {
      console.warn(`> could not parse ${path} — using baked seed`);
    }
  }
  return SEED;
}

async function main() {
  const demoId = process.argv[2] ?? "UC-01";
  console.log(`> embeddings provider: ${EMBEDDINGS_PROVIDER}`);
  const corpus = loadCorpus(demoId);

  // Idempotent reset.
  await db.delete(sceneBeats);
  await db.delete(rights);
  await db.delete(assets);

  // Assets + rights.
  for (const a of corpus) {
    await db.insert(assets).values({
      id: a.id,
      title: a.title,
      series: a.series,
      genre: a.genre,
      year: a.year,
      durationSec: a.durationSec,
      sourceUrl: iaUrl(a.id),
      thumbnailUrl: thumbUrl(a.id),
    });
    await db.insert(rights).values({
      assetId: a.id,
      status: a.rights.status,
      territory: a.rights.territory,
      exclusivity: a.rights.exclusivity,
      expiresOn: a.rights.expiresOn,
      note: a.rights.note ?? null,
    });
  }

  // Flatten beats, embed in one batch, insert.
  const flat = corpus.flatMap((a) =>
    a.beats.map((b, i) => ({ assetId: a.id, beatIdx: i, ...b })),
  );
  console.log(`> embedding ${flat.length} scene beats...`);
  const vectors = await embedBatch(flat.map((b) => b.description));

  for (let i = 0; i < flat.length; i++) {
    const b = flat[i];
    await db.insert(sceneBeats).values({
      id: `${b.assetId}-B${b.beatIdx}`,
      assetId: b.assetId,
      beatType: b.beatType,
      startSec: b.startSec,
      endSec: b.endSec,
      description: b.description,
      embedding: vectors[i],
    });
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sceneBeats);
  console.log(`> done. ${corpus.length} assets, ${count} searchable beats indexed.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
