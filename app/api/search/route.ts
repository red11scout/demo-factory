import { NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { embed } from "@/lib/embeddings";

export const runtime = "nodejs";
export const maxDuration = 60;

const model = anthropic(process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5");

const intentSchema = z.object({
  semanticQuery: z
    .string()
    .describe("A clean restatement of what the producer is looking for, optimized for semantic similarity over scene descriptions."),
  beatType: z.string().nullable().describe("e.g. fight, first kiss, reveal, reunion, storm, verdict — or null."),
  yearFrom: z.number().nullable(),
  yearTo: z.number().nullable(),
  territory: z.enum(["Worldwide", "US-only", "EU-only"]).nullable(),
});

type Stage = { id: string; label: string; detail: string; ms: number };
type Row = Record<string, unknown>;

function rowsOf(result: unknown): Row[] {
  if (Array.isArray(result)) return result as Row[];
  if (result && typeof result === "object" && "rows" in result) {
    return (result as { rows: Row[] }).rows;
  }
  return [];
}

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (e) {
    const err = e as Error;
    // Known limitation: @huggingface/transformers loads onnxruntime-node native
    // binaries (libonnxruntime.so) that Vercel's Turbopack bundler strips. Until
    // we wire EMBEDDINGS_PROVIDER=qwen3 (needs HF_TOKEN) or another remote
    // embedding API, the semantic_search archetype is dev-only.
    const isOnnx = /libonnxruntime|onnxruntime-node|huggingface\/transformers/i.test(
      err.message ?? "",
    );
    return NextResponse.json(
      {
        error: isOnnx
          ? "Semantic-search demo (UC-01) requires a remote embedding provider on Vercel. Set EMBEDDINGS_PROVIDER=qwen3 + HF_TOKEN, or wire OpenAI/Voyage/Cohere in lib/embeddings.ts. Try the MV-04, PRT-02, AE-02, GA-03 demos in the meantime."
          : err.message,
      },
      { status: 503 },
    );
  }
}

async function handle(req: Request) {
  const { query } = (await req.json()) as { query: string };
  if (!query?.trim()) {
    return NextResponse.json({ error: "Empty query" }, { status: 400 });
  }

  const stages: Stage[] = [];
  const time = async <T>(id: string, label: string, fn: () => Promise<[T, string]>) => {
    const t0 = Date.now();
    const [value, detail] = await fn();
    stages.push({ id, label, detail, ms: Date.now() - t0 });
    return value;
  };

  // 1. Parse natural language -> structured intent (Claude).
  const intent = await time("query_parse", "Query Understanding", async () => {
    const { object } = await generateObject({
      model,
      schema: intentSchema,
      prompt:
        `A TV producer searches an unscripted video archive. Extract structured search intent.\n\nQuery: "${query}"`,
    });
    return [object, `intent: "${object.semanticQuery.slice(0, 48)}"`] as const;
  });

  // 2. Embed the semantic query (same model as ingest).
  const vec = await time("embed", "Embedding", async () => {
    const v = await embed(intent.semanticQuery);
    return [v, `${v.length}-dim vector`] as const;
  });
  const vecLit = `[${vec.join(",")}]`;

  // 3. Vector similarity search (pgvector, cosine).
  const K = 12;
  const yearClause =
    intent.yearFrom && intent.yearTo
      ? sql`AND a.year BETWEEN ${intent.yearFrom} AND ${intent.yearTo}`
      : sql``;

  const candidates = await time("vectordb", "Vector Search", async () => {
    const res = await db.execute(sql`
      SELECT b.id, b.beat_type, b.start_sec, b.end_sec, b.description,
             a.id AS asset_id, a.title, a.series, a.genre, a.year,
             a.source_url, a.thumbnail_url,
             r.status AS rights_status, r.territory, r.exclusivity,
             r.expires_on, r.note AS rights_note,
             1 - (b.embedding <=> ${vecLit}::vector) AS score
      FROM scene_beats b
      JOIN assets a ON a.id = b.asset_id
      JOIN rights r ON r.asset_id = a.id
      WHERE 1 = 1 ${yearClause}
      ORDER BY b.embedding <=> ${vecLit}::vector
      LIMIT ${K}
    `);
    const rows = rowsOf(res);
    return [rows, `${rows.length} candidate beats`] as const;
  });

  // 4. Rights-aware filtering / flagging.
  type Filtered = Row & { clearable: boolean; gated: boolean };
  const filtered = await time<Filtered[]>("rights", "Rights Filter", async () => {
    const out: Filtered[] = candidates
      .map((r): Filtered => {
        const status = String(r.rights_status);
        const territory = String(r.territory);
        const clearable =
          status === "cleared" &&
          (!intent.territory ||
            territory === "Worldwide" ||
            territory === intent.territory);
        return { ...r, clearable, gated: !clearable };
      })
      // keep gated items visible but push them down
      .sort((a, b) => Number(b.clearable) - Number(a.clearable));
    const gatedCount = out.filter((r) => r.gated).length;
    return [out, `${gatedCount} flagged for clearance`];
  });

  const top = filtered.slice(0, 6);

  // 5. Rerank + one-line rationale (Claude). Falls back to vector order.
  const reasons = await time("rerank", "Rerank & Explain", async () => {
    try {
      const { object } = await generateObject({
        model,
        schema: z.object({
          ranked: z.array(
            z.object({
              id: z.string(),
              reason: z.string().describe("<= 12 words: why this clip matches the query"),
            }),
          ),
        }),
        prompt:
          `Producer query: "${query}"\n\nRank these clips best-first and give a short reason each.\n\n` +
          top
            .map((r) => `[${r.id}] ${r.title} — ${r.description}`)
            .join("\n"),
      });
      const map = new Map(object.ranked.map((x) => [x.id, x.reason]));
      return [map, `${object.ranked.length} clips explained`] as const;
    } catch {
      const map = new Map(top.map((r) => [String(r.id), "Strong semantic match"]));
      return [map, "fallback: vector order"] as const;
    }
  });

  const results = top.map((r) => ({
    id: String(r.id),
    assetId: String(r.asset_id),
    title: String(r.title),
    series: String(r.series ?? ""),
    genre: String(r.genre),
    year: Number(r.year),
    beatType: String(r.beat_type),
    startSec: Number(r.start_sec),
    endSec: Number(r.end_sec),
    description: String(r.description),
    thumbnailUrl: String(r.thumbnail_url),
    sourceUrl: String(r.source_url),
    score: Number(r.score),
    rights: {
      status: String(r.rights_status),
      territory: String(r.territory),
      exclusivity: String(r.exclusivity),
      expiresOn: r.expires_on ? String(r.expires_on) : null,
      note: r.rights_note ? String(r.rights_note) : null,
    },
    clearable: Boolean((r as { clearable: boolean }).clearable),
    reason: reasons.get(String(r.id)) ?? "Strong semantic match",
  }));

  return NextResponse.json({ intent, stages, results });
}
