/**
 * Embedding abstraction. One interface, two interchangeable backends.
 *
 *   EMBEDDINGS_PROVIDER=local-minilm  (DEFAULT)
 *     all-MiniLM-L6-v2 via Transformers.js. 384-dim, runs in-process on Node
 *     and on Vercel. No API key, no Python, no external infra. Ideal for a demo.
 *
 *   EMBEDDINGS_PROVIDER=qwen3
 *     Qwen3-Embedding-0.6B via Hugging Face hosted inference. Higher retrieval
 *     quality (Apache-2.0, MRL). Needs HF_TOKEN. Returns 1024-dim — update
 *     EMBEDDING_DIM in lib/db/schema.ts and re-ingest if you switch.
 *
 * Both the ingest job and the live query path import embed()/embedBatch() from
 * here, so the picture and the build never diverge.
 */

const PROVIDER = process.env.EMBEDDINGS_PROVIDER ?? "local-minilm";

// ---- local-minilm (Transformers.js) ----------------------------------------
let _extractor: unknown | null = null;
async function getLocalExtractor() {
  if (_extractor) return _extractor;
  const { pipeline } = await import("@huggingface/transformers");
  _extractor = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2",
  );
  return _extractor;
}

async function embedLocal(texts: string[]): Promise<number[][]> {
  const extractor = (await getLocalExtractor()) as (
    input: string[],
    opts: Record<string, unknown>,
  ) => Promise<{ tolist: () => number[][] }>;
  const out = await extractor(texts, { pooling: "mean", normalize: true });
  return out.tolist();
}

// ---- qwen3 (HF hosted inference) -------------------------------------------
async function embedQwen3(texts: string[]): Promise<number[][]> {
  const res = await fetch(
    "https://api-inference.huggingface.co/models/Qwen/Qwen3-Embedding-0.6B",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: texts, options: { wait_for_model: true } }),
    },
  );
  if (!res.ok) throw new Error(`Qwen3 embedding failed: ${res.status}`);
  return (await res.json()) as number[][];
}

// ---- public API ------------------------------------------------------------
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  return PROVIDER === "qwen3" ? embedQwen3(texts) : embedLocal(texts);
}

export async function embed(text: string): Promise<number[]> {
  const [v] = await embedBatch([text]);
  return v;
}

export const EMBEDDINGS_PROVIDER = PROVIDER;
