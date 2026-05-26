import {
  pgTable,
  text,
  integer,
  timestamp,
  vector,
  index,
} from "drizzle-orm/pg-core";

/**
 * EMBEDDING DIMENSION
 * 384 = all-MiniLM-L6-v2 (local-minilm, the default).
 * If you switch EMBEDDINGS_PROVIDER to qwen3 (1024-dim, truncatable via MRL),
 * change this number and re-run `pnpm ingest`.
 */
export const EMBEDDING_DIM = 384;

/** A library asset = a piece of unscripted content (stands in for the MAM/PAM record). */
export const assets = pgTable("assets", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  series: text("series").notNull(),
  genre: text("genre").notNull(),
  year: integer("year").notNull(),
  durationSec: integer("duration_sec").notNull(),
  // Public-domain / open stand-in for the real proxy stream.
  sourceUrl: text("source_url").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  source: text("source").notNull().default("Internet Archive (public domain)"),
});

/**
 * A scene beat = the searchable unit ("first punch", "closing line").
 * In production this is produced by the multi-modal video-language model (UC-04 pre-log).
 * Here it's synthetic scene-log text, embedded for semantic retrieval.
 */
export const sceneBeats = pgTable(
  "scene_beats",
  {
    id: text("id").primaryKey(),
    assetId: text("asset_id")
      .notNull()
      .references(() => assets.id),
    beatType: text("beat_type").notNull(), // e.g. "fight", "reveal", "reunion"
    startSec: integer("start_sec").notNull(),
    endSec: integer("end_sec").notNull(),
    // The natural-language scene log that gets embedded.
    description: text("description").notNull(),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIM }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    // HNSW index for fast cosine-distance ANN search.
    embeddingIdx: index("scene_beats_embedding_idx").using(
      "hnsw",
      t.embedding.op("vector_cosine_ops"),
    ),
  }),
);

/** Synthetic rights ledger — the rights-aware filter layer. */
export const rights = pgTable("rights", {
  assetId: text("asset_id")
    .primaryKey()
    .references(() => assets.id),
  // "cleared" | "restricted" | "expired"
  status: text("status").notNull(),
  territory: text("territory").notNull(), // "Worldwide" | "US-only" | "EU-only"
  exclusivity: text("exclusivity").notNull(), // "none" | "FAST-exclusive"
  expiresOn: text("expires_on"), // ISO date or null
  note: text("note"),
});

export type Asset = typeof assets.$inferSelect;
export type SceneBeat = typeof sceneBeats.$inferSelect;
export type Rights = typeof rights.$inferSelect;
