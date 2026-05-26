/**
 * THE ARCHETYPE LIBRARY — the only thing that forks per use-case shape.
 *
 * Each archetype knows three things:
 *   - flow(spec)      : the React Flow graph (nodes + edges + which stages the
 *                       backend runs automatically) — feeds the live diagram.
 *   - corpusShape     : instructions for the synthesizer to fabricate a domain
 *                       corpus in the right shape (the universal data adapter).
 *   - routeHandler    : the name of the API logic that implements it.
 *
 * The chassis (page, flow panel, metrics strip, HITL gate, export) is invariant
 * and consumes archetype.flow(spec). A new client almost always reuses an
 * existing archetype; a genuinely novel one adds a single entry here and is then
 * available to every client. The library converges fast.
 */
import type { ArchetypeId, DemoSpec, FlowNodeSpec } from "./demo-spec";

export interface ArchetypeFlow {
  nodes: FlowNodeSpec[];
  edges: { source: string; target: string }[];
  /** stages the backend runs automatically (drive the animation) */
  runtimeStages: string[];
}

interface Archetype {
  id: ArchetypeId;
  label: string;
  blurb: string;
  /** plain-language spec for the corpus synthesizer */
  corpusShape: string;
  routeHandler: string;
  flow: (spec: DemoSpec) => ArchetypeFlow;
}

/** linear chain helper */
const chain = (nodes: FlowNodeSpec[]) => ({
  nodes,
  edges: nodes.slice(0, -1).map((n, i) => ({ source: n.id, target: nodes[i + 1].id })),
});

/** pick a named integration from the spec, or fall back */
const integ = (spec: DemoSpec, kw: string, fallback: string) =>
  spec.integrations.find((i) => i.toLowerCase().includes(kw)) ?? fallback;

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  semantic_search: {
    id: "semantic_search",
    label: "Semantic Search",
    blurb: "Natural-language query over a library, rights-aware, with a shortlist gate.",
    corpusShape:
      "A JSON array of ~12 objects, each: {id, title, series, genre, year, durationSec, sourceUrl, thumbnailUrl, beats:[{beatType,startSec,endSec,description}], rights:{status('cleared'|'restricted'|'expired'), territory('Worldwide'|'US-only'|'EU-only'), exclusivity('none'|'FAST-exclusive'), expiresOn(ISO date or null), note}}. Include some restricted/expired rights.",
    routeHandler: "search",
    flow: (spec) => {
      const { nodes, edges } = chain([
        { id: "producer", label: "User", sublabel: "Natural-language query", prodComponent: "User / Client" },
        { id: "webapp", label: "Search Web App", sublabel: "this UI", prodComponent: integ(spec, "web", "Search web app") },
        { id: "query_parse", label: "Query Understanding", sublabel: "Claude · parse → intent", prodComponent: "AI gateway · Retrieval" },
        { id: "embed", label: "Embedding", sublabel: "open model · vector", prodComponent: "Multi-modal model" },
        { id: "vectordb", label: "Vector Search", sublabel: "pgvector · cosine", prodComponent: integ(spec, "vector", "Vector DB") },
        { id: "rights", label: "Rights Filter", sublabel: "territory · exclusivity", prodComponent: integ(spec, "rights", "Rights DB") },
        { id: "rerank", label: "Rerank & Explain", sublabel: "Claude · why it matches", prodComponent: "AI gateway · Analysis" },
        { id: "hitl", label: "HITL Gate", sublabel: "validate shortlist", prodComponent: "Human checkpoint" },
        { id: "export", label: "Export", sublabel: "downstream package", prodComponent: integ(spec, "rally", "Supply chain export") },
      ]);
      return { nodes, edges, runtimeStages: ["query_parse", "embed", "vectordb", "rights", "rerank"] };
    },
  },

  validate_and_flag: {
    id: "validate_and_flag",
    label: "Validate & Flag",
    blurb: "Check incoming records against rules + an LLM classifier, flag exceptions for disposition.",
    corpusShape:
      "A set of ~20 incoming records (configs/transactions/submissions) each with fields, some containing realistic errors or policy violations; include a small ruleset.",
    routeHandler: "validate",
    flow: (spec) => {
      const { nodes, edges } = chain([
        { id: "source", label: "Incoming Records", sublabel: "queue of submissions", prodComponent: integ(spec, "system", "Source system") },
        { id: "ingest", label: "Ingest & Normalize", sublabel: "parse fields", prodComponent: "ETL" },
        { id: "rules", label: "Deterministic Rules", sublabel: "hard checks", prodComponent: "Rules engine" },
        { id: "classify", label: "LLM Classifier", sublabel: "Claude · ambiguous cases", prodComponent: "AI gateway · Analysis" },
        { id: "flag", label: "Flag & Score", sublabel: "risk + reason", prodComponent: "Scoring" },
        { id: "hitl", label: "HITL Disposition", sublabel: "approve / reject", prodComponent: "Human checkpoint" },
        { id: "commit", label: "Commit", sublabel: "write decision", prodComponent: integ(spec, "manage", "System of record") },
      ]);
      return { nodes, edges, runtimeStages: ["ingest", "rules", "classify", "flag"] };
    },
  },

  extract_and_draft: {
    id: "extract_and_draft",
    label: "Extract & Draft",
    blurb: "Parse long documents into structured terms, check conflicts, draft an output for human sign-off.",
    corpusShape:
      "A set of ~8 long source documents (contracts/leases/protocols) with extractable terms, a few containing conflicts or expiries; plus a registry of prior records to check against.",
    routeHandler: "extract",
    flow: (spec) => {
      const { nodes, edges } = chain([
        { id: "docs", label: "Source Documents", sublabel: "PDFs / long text", prodComponent: integ(spec, "contract", "Document store") },
        { id: "extract", label: "Extract Terms", sublabel: "Claude workers · parallel", prodComponent: "Long-context LLM" },
        { id: "conflict", label: "Conflict Check", sublabel: "vs. registry", prodComponent: integ(spec, "rights", "Registry") },
        { id: "draft", label: "Draft Output", sublabel: "Claude · generate", prodComponent: "AI gateway · Creation" },
        { id: "hitl", label: "HITL Sign-off", sublabel: "counsel reviews & signs", prodComponent: "Human checkpoint" },
        { id: "store", label: "Store", sublabel: "filed output", prodComponent: integ(spec, "manage", "System of record") },
      ]);
      return { nodes, edges, runtimeStages: ["extract", "conflict", "draft"] };
    },
  },

  generate_and_assemble: {
    id: "generate_and_assemble",
    label: "Generate & Assemble",
    blurb: "Find moments across a library, assemble a draft artifact, pre-screen for safety, editor approves.",
    corpusShape:
      "A library of ~12 source assets with taggable moments/beats; include brand-safety-relevant attributes on some.",
    routeHandler: "assemble",
    flow: (spec) => {
      const { nodes, edges } = chain([
        { id: "library", label: "Source Library", sublabel: "assets + beats", prodComponent: integ(spec, "rally", "Media supply chain") },
        { id: "detect", label: "Beat Detection", sublabel: "Claude · find moments", prodComponent: "Multi-modal model" },
        { id: "assemble", label: "Draft Assembly", sublabel: "rules + LLM", prodComponent: "AI gateway · Creation" },
        { id: "safety", label: "Brand-Safety Pre-Screen", sublabel: "classifier", prodComponent: integ(spec, "safety", "Brand safety tooling") },
        { id: "hitl", label: "Editor Approves", sublabel: "review every cut", prodComponent: "Human checkpoint" },
        { id: "distribute", label: "Distribute", sublabel: "channels / NLE", prodComponent: integ(spec, "channel", "Distribution") },
      ]);
      return { nodes, edges, runtimeStages: ["detect", "assemble", "safety"] };
    },
  },

  summarize_and_brief: {
    id: "summarize_and_brief",
    label: "Summarize & Brief",
    blurb: "Ingest a corpus, synthesize an executive brief with citations, human reviews before sending.",
    corpusShape:
      "A set of ~10 source documents/records on a single topic with overlapping and conflicting facts.",
    routeHandler: "brief",
    flow: () => {
      const { nodes, edges } = chain([
        { id: "sources", label: "Sources", sublabel: "documents / feeds", prodComponent: "Source systems" },
        { id: "retrieve", label: "Retrieve", sublabel: "rank relevant", prodComponent: "Vector DB" },
        { id: "synthesize", label: "Synthesize", sublabel: "Claude · brief + cites", prodComponent: "AI gateway" },
        { id: "hitl", label: "HITL Review", sublabel: "approve brief", prodComponent: "Human checkpoint" },
        { id: "deliver", label: "Deliver", sublabel: "send / publish", prodComponent: "Delivery" },
      ]);
      return { nodes, edges, runtimeStages: ["retrieve", "synthesize"] };
    },
  },

  route_and_dispatch: {
    id: "route_and_dispatch",
    label: "Route & Dispatch",
    blurb: "Classify an incoming request and dispatch to the right specialized handler.",
    corpusShape:
      "A set of ~20 incoming requests spanning several categories, some ambiguous between two categories.",
    routeHandler: "route",
    flow: () => {
      const { nodes, edges } = chain([
        { id: "intake", label: "Intake", sublabel: "incoming request", prodComponent: "Intake channel" },
        { id: "classify", label: "Classify", sublabel: "Claude · category + confidence", prodComponent: "AI gateway" },
        { id: "route", label: "Route", sublabel: "pick handler", prodComponent: "Router" },
        { id: "hitl", label: "HITL Fallback", sublabel: "low-confidence → human", prodComponent: "Human checkpoint" },
        { id: "dispatch", label: "Dispatch", sublabel: "to handler", prodComponent: "Downstream" },
      ]);
      return { nodes, edges, runtimeStages: ["classify", "route"] };
    },
  },
};
