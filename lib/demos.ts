/**
 * Demo registry — proof of repeatability.
 *
 * Four use cases, four companies, four industries, three different archetypes —
 * all expressed as the SAME DemoSpec shape and rendered by the SAME chassis.
 * In production each of these comes straight from that client's Solution Builder
 * export via normalizeFromBuilder(); they're inlined here only to demonstrate.
 *
 * Notice each spec resolves to a different archetype -> a different live flow
 * graph -> a different runtime, with zero chassis forking.
 */
import type { DemoSpec } from "./demo-spec";
import { ARCHETYPES } from "./archetypes";

export const DEMOS: DemoSpec[] = [
  {
    id: "UC-01",
    name: "Multi-Modal Library Search & Semantic Archive Discovery",
    customer: "A+E Global Media",
    industry: "Entertainment",
    strategicTheme: "Library-Driven Content Monetization",
    pattern: "tool_use",
    archetype: "semantic_search",
    primitives: ["Research & Information Retrieval", "Data Analysis", "Content Creation"],
    dataTypes: ["unstructured", "semi_structured", "structured"],
    integrations: ["SDVI Rally media supply chain", "Vector database (Pinecone/Weaviate-class)", "Rights management database", "Search web app"],
    hitl: "Research producer validates clip shortlists before they reach FAST partners; rights-restricted clips require clearance.",
    outcomes: ["Producer-to-clip discovery from 1 week to <2 minutes", "Eliminate 38,000 research-producer hours/yr"],
    metrics: [
      { label: "Time to clip", before: "5–7 days", after: "Under 1 hour", delta: "98% faster" },
      { label: "Annual cost", before: "$4.2M/yr", after: "$520K/yr", delta: "88% lower" },
      { label: "First-pass relevance", before: "65%", after: "92%", delta: "+27pp" },
      { label: "Throughput", before: "180 req/mo", after: "400+ req/mo", delta: "2.2×" },
    ],
    domain: "Entertainment — unscripted video archive of war, true-crime, history and reality series.",
  },
  {
    id: "MV-04",
    name: "Yield Excursion Triage & Root-Cause Validation",
    customer: "Mativ Holdings",
    industry: "Specialty Materials / Manufacturing",
    strategicTheme: "Manufacturing Yield Optimization",
    pattern: "tool_use",
    archetype: "validate_and_flag",
    primitives: ["Workflow Automation", "Data Analysis", "Research & Information Retrieval"],
    dataTypes: ["structured", "semi_structured"],
    integrations: ["MES / process historian", "SPC ruleset", "Quality management system"],
    hitl: "Process engineer dispositions every flagged lot before hold/release; high-cost lots require plant-manager sign-off.",
    outcomes: ["Catch excursions at the line, not at final QC", "Reduce scrap from late detection"],
    metrics: [
      { label: "Detection lag", before: "Next shift", after: "< 5 min", delta: "Real-time" },
      { label: "Scrap cost", before: "$3.1M/yr", after: "$0.9M/yr", delta: "71% lower" },
      { label: "False holds", before: "14%", after: "4%", delta: "−10pp" },
      { label: "Engineer hours", before: "11k/yr", after: "3k/yr", delta: "73% less" },
    ],
    domain: "Specialty materials manufacturing — production lot records with process parameters and SPC limits.",
  },
  {
    id: "PRT-02",
    name: "Lease Abstraction & Clause-Risk Surfacing",
    customer: "Piedmont Realty Trust",
    industry: "Commercial Real Estate",
    strategicTheme: "Portfolio Risk & Velocity",
    pattern: "orchestrator_worker",
    archetype: "extract_and_draft",
    primitives: ["Research & Information Retrieval", "Content Creation", "Data Analysis"],
    dataTypes: ["unstructured", "structured"],
    integrations: ["Contract management system", "Lease registry", "Long-context LLM endpoint"],
    hitl: "Asset-management counsel reviews and signs every abstract; non-standard clauses escalate to senior counsel.",
    outcomes: ["Lease abstraction from days to minutes", "Surface clause risk before renewal windows"],
    metrics: [
      { label: "Abstraction time", before: "2–3 days", after: "Under 1 hour", delta: "95% faster" },
      { label: "Clause-risk catch", before: "60%", after: "93%", delta: "+33pp" },
      { label: "Legal cost", before: "$1.8M/yr", after: "$0.4M/yr", delta: "78% lower" },
      { label: "Throughput", before: "40/mo", after: "200+/mo", delta: "5×" },
    ],
    domain: "Commercial real estate — office and retail lease agreements with rent schedules, options, and restrictive clauses.",
  },
  {
    id: "AE-02",
    name: "Rights-Aware Automated Licensing Proposal Engine",
    customer: "A+E Global Media",
    industry: "Entertainment",
    strategicTheme: "Library-Driven Content Monetization",
    pattern: "orchestrator_worker",
    archetype: "extract_and_draft",
    primitives: ["Research & Information Retrieval", "Content Creation", "Data Analysis", "Workflow Automation"],
    dataTypes: ["unstructured", "structured"],
    integrations: ["Contract management system", "Rights management database", "Long-context LLM endpoint"],
    hitl: "Rights counsel reviews and signs every customer-facing proposal; General Counsel approves confidential or never-before-licensed material.",
    outcomes: ["Licensing proposal cycle from 21 days to 3 days", "Surface 90% of rights conflicts before the proposal", "Eliminate 22,000 hours of attorney contract-reading/yr"],
    metrics: [
      { label: "Proposal cycle", before: "21 days", after: "3 days", delta: "86% faster" },
      { label: "Legal cost", before: "$2.5M/yr", after: "$0.5M/yr", delta: "80% lower" },
      { label: "Conflict catch", before: "Late / 60%", after: "90% pre-proposal", delta: "+30pp" },
      { label: "Attorney hours", before: "22k/yr", after: "5k/yr", delta: "77% less" },
    ],
    domain: "Entertainment — rights and licensing contracts across territory, exclusivity, windows, and talent/music clearances.",
  },
  {
    id: "GA-03",
    name: "IACUC Protocol Pre-Review & Compliance Triage",
    customer: "Georgia Aquarium",
    industry: "Zoological / Research",
    strategicTheme: "Research Compliance Throughput",
    pattern: "tool_use",
    archetype: "validate_and_flag",
    primitives: ["Workflow Automation", "Research & Information Retrieval", "Data Analysis"],
    dataTypes: ["semi_structured", "unstructured"],
    integrations: ["Protocol management system", "IACUC policy library", "Document store"],
    hitl: "IACUC coordinator dispositions every flagged protocol; welfare-relevant flags route to the attending veterinarian.",
    outcomes: ["Cut pre-review cycle time", "Catch missing welfare/compliance elements before committee"],
    metrics: [
      { label: "Pre-review time", before: "9 days", after: "Same day", delta: "≈90% faster" },
      { label: "Completeness", before: "71%", after: "96%", delta: "+25pp" },
      { label: "Coordinator hours", before: "4k/yr", after: "1.2k/yr", delta: "70% less" },
      { label: "Resubmissions", before: "38%", after: "11%", delta: "−27pp" },
    ],
    domain: "Zoological research — animal-care/use protocol submissions checked against IACUC policy requirements.",
  },
];

export function getDemo(id: string): DemoSpec {
  return DEMOS.find((d) => d.id === id) ?? DEMOS[0];
}

/** Resolve a spec into everything the chassis needs to render. */
export function resolveDemo(spec: DemoSpec) {
  const archetype = ARCHETYPES[spec.archetype];
  return { spec, archetype, flow: archetype.flow(spec) };
}
