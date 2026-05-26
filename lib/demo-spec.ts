/**
 * THE CONTRACT.
 *
 * Every demo in the factory is a pure function of a DemoSpec. The Solution
 * Builder is already the intake form — its per-use-case JSON export normalizes
 * into this shape, regardless of company or industry. Nothing downstream
 * (chassis, flow diagram, corpus, route) hardcodes a client.
 */

export type Pattern =
  | "tool_use"
  | "orchestrator_worker"
  | "react"
  | "planning"
  | "semantic_router";

export type ArchetypeId =
  | "semantic_search" // retrieve over a library          (UC-01)
  | "extract_and_draft" // parse docs -> structured -> draft (UC-02)
  | "validate_and_flag" // check inputs against rules        (UC-08)
  | "generate_and_assemble" // find beats -> assemble draft  (UC-03)
  | "summarize_and_brief" // long context -> executive brief
  | "route_and_dispatch"; // classify -> route to handler

export interface FlowNodeSpec {
  id: string;
  label: string;
  sublabel: string;
  /** the production component this open substitute stands in for */
  prodComponent: string;
}

export interface MetricRow {
  label: string;
  before: string;
  after: string;
  delta: string;
}

export interface DemoSpec {
  id: string;
  name: string;
  customer: string;
  industry: string;
  strategicTheme: string;
  pattern: Pattern;
  archetype: ArchetypeId;
  primitives: string[];
  dataTypes: string[];
  integrations: string[];
  hitl: string;
  outcomes: string[];
  metrics: MetricRow[];
  /** domain hint handed to the corpus synthesizer */
  domain: string;
}

/**
 * Archetype inference. The Builder gives us pattern + AI primitives; that's
 * enough to pick the interaction template. Tuned to be conservative — unknown
 * combinations fall back to summarize_and_brief, the safest universal demo.
 */
export function inferArchetype(
  pattern: Pattern,
  primitives: string[],
  name = "",
): ArchetypeId {
  const p = primitives.map((x) => x.toLowerCase()).join(" ");
  const n = name.toLowerCase();
  const has = (...k: string[]) => k.some((x) => p.includes(x) || n.includes(x));

  if (has("search", "discovery", "retrieval") && pattern === "tool_use")
    return "semantic_search";
  if (has("validat", "campaign", "quality", "compliance check"))
    return "validate_and_flag";
  if (has("proposal", "contract", "licens", "extract", "abstract"))
    return "extract_and_draft";
  if (has("promo", "clip", "generat", "assembl", "creation"))
    return "generate_and_assemble";
  if (pattern === "semantic_router") return "route_and_dispatch";
  return "summarize_and_brief";
}

/** Map a Solution Builder export (any client) -> DemoSpec. */
export function normalizeFromBuilder(json: any): DemoSpec {
  const uc = json.systemArchitecture?.useCase ?? json.useCase ?? {};
  const wf = json.systemArchitecture?.workflow ?? {};
  const cm = wf.comparisonMetrics ?? {};
  const pattern: Pattern = (uc.agenticPattern ?? json.systemArchitecture?.pattern ?? "tool_use") as Pattern;
  const primitives: string[] = uc.aiPrimitives ?? json.agenticWorkflow?.primitives ?? [];

  const metric = (label: string, m: any): MetricRow | null =>
    m ? { label, before: m.before, after: m.after, delta: m.improvement } : null;

  const metrics = [
    metric("Time to value", cm.timeReduction),
    metric("Annual cost", cm.costReduction),
    metric("Quality", cm.qualityImprovement),
    metric("Throughput", cm.throughputIncrease),
  ].filter(Boolean) as MetricRow[];

  return {
    id: uc.id ?? json.useCase?.id ?? "UC-XX",
    name: uc.name ?? json.useCase?.name ?? "Untitled Use Case",
    customer: json.project?.companyName ?? "Customer",
    industry: json.project?.industry ?? "—",
    strategicTheme: uc.strategicTheme ?? "",
    pattern,
    archetype: inferArchetype(pattern, primitives, uc.name),
    primitives,
    dataTypes: uc.dataTypes ?? [],
    integrations: uc.integrations ?? [],
    hitl: uc.hitlCheckpoint ?? "",
    outcomes: uc.desiredOutcomes ?? [],
    metrics,
    domain: `${json.project?.industry ?? ""} — ${uc.description ?? uc.name ?? ""}`.trim(),
  };
}
