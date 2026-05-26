# UC-01 — Multi-Modal Library Search (Working Prototype)

An interactive "art of the possible" prototype of **UC-01: Multi-Modal Library Search & Semantic Archive Discovery** from the A+E Global Media AI Solution Builder report. Built from the UC-01 export JSON, with open-source tooling and a synthetic public-domain corpus so it runs end-to-end with no proprietary data.

A producer types a query in plain language → relevant clips return in seconds with a confidence score, a rights flag, and a one-line reason → the producer builds a shortlist, passes the human-in-the-loop gate, and exports a Rally-compatible package. The **architecture diagram from the report is live** — it lights up node-by-node as each request actually runs through it.

## Stack

| Layer | Choice | Notes |
|---|---|---|
| App | Next.js 15 (App Router) · TypeScript | Deploys to Vercel as-is |
| Orchestration | Vercel AI SDK + Anthropic provider | Bounded tool-use loop — no LangChain |
| Embeddings | Transformers.js `all-MiniLM-L6-v2` (384-dim) | In-process, no key. Swap to `qwen3` via one env var |
| Vector store | **pgvector on Neon** | HNSW + cosine; stays in stack |
| Visualization | `@xyflow/react` (React Flow) | The live system-path panel |
| Data | Synthetic public-domain corpus | `lib/seed-data.ts` — swap for the Internet Archive API later |

## Component substitution — report → prototype

| PRD / report component | Open substitute here |
|---|---|
| Unscripted MAM/PAM asset source | Synthetic corpus (Internet Archive-style) in `lib/seed-data.ts` |
| Multi-modal video-language model | Text embeddings over AI-style scene logs (`lib/embeddings.ts`) |
| Vector DB (Pinecone/Weaviate-class) | pgvector on Neon (`lib/db/schema.ts`) |
| Rights management database | Synthetic rights ledger (`rights` table) |
| AI gateway + model registry | Vercel AI SDK + Anthropic (`app/api/search/route.ts`) |
| HITL checkpoint | "Validate shortlist" gate before export |
| SDVI Rally export | Mock package download (`rally-package.json`) |
| SDVI Rally search web app | This Next.js UI |

## Setup

```bash
pnpm install
cp .env.example .env          # fill in DATABASE_URL + ANTHROPIC_API_KEY

# one-time in the Neon SQL editor:
#   CREATE EXTENSION IF NOT EXISTS vector;

pnpm db:push                  # create tables + HNSW index
pnpm ingest                   # load corpus, embed scene beats, upsert
pnpm dev                      # http://localhost:3000
```

Deploy: push to a Git repo, import into Vercel, set the same env vars. The embedding model downloads on first cold start (no key needed).

## How the live diagram works

`lib/uc01-spec.ts` is the single source of truth: its node ids are the same stage ids the search route returns in its timing trace. The UI replays that trace, so the diagram narrates the real request (Query Understanding → Embedding → Vector Search → Rights Filter → Rerank), then the HITL and Export nodes light on the producer's actions. Picture and build never diverge — change the spec, both update.

## Swapping in higher-quality embeddings

Set `EMBEDDINGS_PROVIDER=qwen3` and `HF_TOKEN=...`, change `EMBEDDING_DIM` in `lib/db/schema.ts` to match (Qwen3-Embedding-0.6B is 1024-dim, MRL-truncatable), then re-run `pnpm db:push && pnpm ingest`.
