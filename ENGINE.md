# The Demo Factory

This repo is not a UC-01 demo. It's a **repeatable engine** that turns any Solution Builder export — any client, any industry — into a working "art of the possible" prototype. UC-01 is just the first archetype's reference implementation.

## Why this generalizes

The variety across companies is real, but the *structure* of an AI use case is low-dimensional. Every Builder export collapses onto two axes — an **agentic pattern** and a **task primitive** — which resolve to a small set of **archetypes**. The only genuinely high-variance axis is the **domain**, and that's absorbed by synthesizing the corpus with Claude.

> Repeatability = a small fixed set of archetypes × infinite domains absorbed by synthesis.

## Three layers

1. **Spec** — `lib/demo-spec.ts`. The canonical `DemoSpec`. `normalizeFromBuilder(json)` maps any client's Builder export into it. The Builder is already your intake form.
2. **Chassis** (invariant) — `app/page.tsx`, `components/architecture-flow.tsx`, the metrics strip, HITL gate, export, theming. Built once. A pure function of the spec. **Never forks per client.**
3. **Variant** — the **archetype** (`lib/archetypes.ts`: flow graph + corpus shape + route handler) and the **corpus** (`scripts/synthesize-corpus.ts`). The only things that change per use-case shape.

## Archetype library (`lib/archetypes.ts`)

| Archetype | Pattern × primitive | Example | Route handler |
|---|---|---|---|
| `semantic_search` | tool_use × retrieval | A+E UC-01 | ✅ `search` (built) |
| `validate_and_flag` | tool_use × validation | Mativ yield, Georgia Aquarium IACUC | ✅ `validate` (built) |
| `extract_and_draft` | orchestrator_worker × extraction | Piedmont leases, A+E UC-02 | ✅ `extract` (built) |
| `generate_and_assemble` | orchestrator_worker × generation | A+E UC-03 promos | ◻︎ `assemble` |
| `summarize_and_brief` | any × summarization | universal fallback | ◻︎ `brief` |
| `route_and_dispatch` | semantic_router | triage | ◻︎ `route` |

~6 archetypes cover the vast majority of enterprise use cases. A new client almost always reuses one. A genuinely novel use case adds **one entry** here and is then available to *every* client — the library converges fast. That's the flywheel.

## Repeatability, proven

`lib/demos.ts` carries five specs across four industries — A+E search + A+E licensing, Mativ (manufacturing), Piedmont (real estate), Georgia Aquarium (zoological) — spanning three archetypes including an orchestrator-worker pattern, all rendered by the same chassis. Flip `ACTIVE_DEMO_ID` in `app/page.tsx` and the live diagram, metrics, and copy re-skin to that client with zero other changes.

## The generation pipeline (the factory)

```
Builder export JSON
   → normalizeFromBuilder()        // -> DemoSpec
   → inferArchetype()              // pick the template
   → pnpm new-demo <id>            // synthesize corpus (+ index if semantic_search)
   → switcher picks the demo       // live flow + UI + metrics re-skin
   → deploy to Vercel
```

`pnpm new-demo <id>` (`scripts/build-demo.ts`) runs the whole data side in one command: synthesize the corpus into `lib/generated/<id>.json`, and — only for `semantic_search` — index it into pgvector. The in-app **demo switcher** flips between all registered clients live, so one deploy serves the whole portfolio (or deploy per client for isolation).

## The chassis no longer forks

Two seams used to grow by hand; both are now closed:

- **Panel wiring** — `lib/archetype-ui.tsx` maps each archetype to its endpoint + panel render adapter. `app/page.tsx` looks up `ARCHETYPE_UI[spec.archetype]` and renders whatever it returns. Adding an archetype never edits the page.
- **Data pipeline** — `scripts/ingest.ts` prefers the synthesizer's output and falls back to the baked seed; `build-demo.ts` orchestrates synth → index.

Adding an archetype is now exactly: **one route + one panel + one registry line.** Nothing else moves.

## Build order to finish the engine

1. ✅ **`semantic_search`** — route + renderer (`app/api/search`, `components/search-panel.tsx`).
2. ✅ **Generalized ingest + one-command pipeline** — `pnpm new-demo <id>`.
3. ✅ **`validate_and_flag`** — one handler covers Mativ AND Georgia Aquarium; no DB.
4. ✅ **`extract_and_draft`** — orchestrator-worker; covers Piedmont AND A+E UC-02; no DB.
5. ✅ **Panel registry + live demo switcher** — chassis stopped forking.
6. ◻︎ Remaining archetypes (`summarize_and_brief`, `route_and_dispatch`) — easy variations, add on demand.

Each archetype = one route handler + one renderer + one registry line. The chassis, flow panel, corpus synthesizer, and spec layer never change.
