/**
 * Archetype → UI registry. This is what lets the chassis stop forking.
 *
 * Each archetype registers its endpoint, queue label, and a render adapter that
 * maps the generic PanelCtx onto that archetype's panel props. Adding a new
 * archetype = add a route + a panel + ONE entry here. `app/page.tsx` never
 * changes again — it just looks up ARCHETYPE_UI[spec.archetype].
 */
import type { ReactNode } from "react";
import type { ArchetypeId, DemoSpec } from "./demo-spec";
import SearchPanel from "@/components/search-panel";
import ValidatePanel from "@/components/validate-panel";
import ExtractPanel from "@/components/extract-panel";
import { VALIDATE_CORPORA } from "./validate-seed";
import { EXTRACT_CORPORA } from "./extract-seed";

export interface PanelCtx {
  loading: boolean;
  response: any;
  spec: DemoSpec;
  approved: boolean;
  committed: boolean;
  /** POSTs to the archetype endpoint with { demoId, ...extra } and animates the flow */
  run: (extra?: Record<string, unknown>) => void;
  onApprove: (n: number) => void;
  onCommit: (pkg: unknown) => void;
}

interface ArchetypeUI {
  endpoint: string;
  queueLabel: string;
  render: (ctx: PanelCtx) => ReactNode;
}

export const ARCHETYPE_UI: Partial<Record<ArchetypeId, ArchetypeUI>> = {
  semantic_search: {
    endpoint: "/api/search",
    queueLabel: "Producer Search",
    render: (c) => (
      <SearchPanel
        loading={c.loading}
        response={c.response}
        onSearch={(q) => c.run({ query: q })}
        onApprove={c.onApprove}
        onExport={c.onCommit}
        approved={c.approved}
        exported={c.committed}
      />
    ),
  },
  validate_and_flag: {
    endpoint: "/api/validate",
    queueLabel: "Validation Queue",
    render: (c) => (
      <ValidatePanel
        loading={c.loading}
        response={c.response}
        recordCount={VALIDATE_CORPORA[c.spec.id]?.records.length ?? 0}
        unit={VALIDATE_CORPORA[c.spec.id]?.unit ?? "record"}
        onRun={() => c.run()}
        onApprove={c.onApprove}
        onCommit={c.onCommit}
        approved={c.approved}
        committed={c.committed}
      />
    ),
  },
  extract_and_draft: {
    endpoint: "/api/extract",
    queueLabel: "Document Queue",
    render: (c) => (
      <ExtractPanel
        loading={c.loading}
        response={c.response}
        docCount={EXTRACT_CORPORA[c.spec.id]?.documents.length ?? 0}
        unit={EXTRACT_CORPORA[c.spec.id]?.unit ?? "document"}
        onRun={() => c.run()}
        onApprove={c.onApprove}
        onCommit={c.onCommit}
        approved={c.approved}
        committed={c.committed}
      />
    ),
  },
};
