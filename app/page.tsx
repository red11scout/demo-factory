"use client";

import { useState } from "react";
import ArchitectureFlow from "@/components/architecture-flow";
import BlueAllyLogo from "@/components/brand/blueally-logo";
import ThemeToggle from "@/components/theme-toggle";
import { DEMOS, getDemo, resolveDemo } from "@/lib/demos";
import { ARCHETYPE_UI } from "@/lib/archetype-ui";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Default demo; switchable live via the picker. Each demo is a pure function of
// its spec — the chassis re-skins with zero code changes.
const ACTIVE_DEMO_ID = "UC-01";

export default function Home() {
  const [demoId, setDemoId] = useState(ACTIVE_DEMO_ID);
  const { spec, flow } = resolveDemo(getDemo(demoId));
  const ui = ARCHETYPE_UI[spec.archetype];

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [active, setActive] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [approved, setApproved] = useState(false);
  const [exported, setExported] = useState(false);

  function reset() {
    setResponse(null);
    setActive(null);
    setDone([]);
    setApproved(false);
    setExported(false);
  }
  function switchDemo(id: string) {
    if (id === demoId) return;
    setDemoId(id);
    reset();
  }

  // Generic runner: POSTs to the archetype's endpoint, then replays the real
  // stage trace onto the live diagram. Shared by every archetype.
  async function execute(endpoint: string, body: unknown) {
    setLoading(true);
    setResponse(null);
    setApproved(false);
    setExported(false);
    setActive(null);
    // Pre-light the nodes that precede the first auto-run stage (differs per archetype).
    const firstRuntime = flow.runtimeStages[0];
    const preNodes: string[] = [];
    for (const n of flow.nodes) {
      if (n.id === firstRuntime) break;
      preNodes.push(n.id);
    }
    setDone(preNodes);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      for (const stage of data.stages) {
        setActive(stage.id);
        await delay(Math.min(Math.max(stage.ms, 420), 1400));
        setDone((prev) => [...prev, stage.id]);
      }
      setActive(null);
      setResponse(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // One runner for every archetype: endpoint from the registry, demoId from spec,
  // plus whatever extra the panel passes (e.g. a search query).
  const run = (extra: Record<string, unknown> = {}) => {
    if (!ui) return;
    execute(ui.endpoint, { demoId: spec.id, ...extra });
  };

  async function approve() {
    setActive("hitl");
    await delay(550);
    setDone((prev) => [...prev, "hitl"]);
    setActive(null);
    setApproved(true);
  }

  async function exportPkg() {
    const finalId = flow.nodes[flow.nodes.length - 1]?.id ?? "export";
    setActive(finalId);
    await delay(550);
    setDone((prev) => [...prev, finalId]);
    setActive(null);
    setExported(true);
  }

  return (
    <main style={{ maxWidth: 1320, margin: "0 auto", padding: "34px 28px 60px" }}>
      {/* brand bar: logo (swaps by theme) + theme toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 22,
        }}
      >
        <BlueAllyLogo height={32} />
        <ThemeToggle />
      </div>

      {/* demo switcher — the button BlueAlly presses per client */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {DEMOS.map((d) => {
          const on = d.id === demoId;
          return (
            <button
              key={d.id}
              onClick={() => switchDemo(d.id)}
              className="font-mono"
              style={{
                padding: "7px 12px",
                borderRadius: 8,
                fontSize: 11,
                border: `1px solid ${on ? "var(--color-amber)" : "var(--color-line)"}`,
                background: on ? "color-mix(in oklab, var(--color-amber) 12%, transparent)" : "transparent",
                color: on ? "var(--color-amber)" : "var(--color-muted)",
                cursor: "pointer",
              }}
            >
              {d.customer} · {d.id}
            </button>
          );
        })}
      </div>

      {/* header */}
      <div className="eyebrow">AI Solution Builder — Working Prototype</div>
      <h1
        className="font-display"
        style={{ fontSize: 42, lineHeight: 1.05, margin: "8px 0 0", letterSpacing: "-0.01em" }}
      >
        {spec.name}
      </h1>
      <div style={{ display: "flex", gap: 9, marginTop: 12, flexWrap: "wrap" }}>
        {[spec.customer, spec.industry, spec.id, `Pattern · ${spec.pattern.replace(/_/g, " ")}`, spec.strategicTheme].map((t) => (
          <span
            key={t}
            className="font-mono"
            style={{
              fontSize: 11,
              color: "var(--color-muted)",
              border: "1px solid var(--color-line)",
              borderRadius: 6,
              padding: "4px 9px",
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* before / after metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 12,
          margin: "26px 0 30px",
        }}
      >
        {spec.metrics.map((m) => (
          <div
            key={m.label}
            style={{
              background: "var(--color-panel)",
              border: "1px solid var(--color-line)",
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <div className="eyebrow">{m.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 7 }}>
              <span style={{ fontSize: 13, color: "var(--color-muted)", textDecoration: "line-through" }}>
                {m.before}
              </span>
              <span style={{ color: "var(--color-muted)" }}>→</span>
              <span className="font-display" style={{ fontSize: 24, color: "var(--color-fg)" }}>
                {m.after}
              </span>
            </div>
            <div className="font-mono" style={{ fontSize: 10.5, color: "var(--color-signal)", marginTop: 4 }}>
              {m.delta}
            </div>
          </div>
        ))}
      </div>

      {/* split: search | live architecture */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "stretch" }}>
        <section
          style={{
            flex: "1 1 560px",
            minWidth: 320,
            background: "color-mix(in oklab, var(--color-panel) 75%, transparent)",
            border: "1px solid var(--color-line)",
            borderRadius: 16,
            padding: 20,
            minHeight: 680,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 13 }}>
            {ui?.queueLabel ?? "Demo"}
          </div>
          {/* The chassis no longer forks per archetype — it renders whatever the
              registry returns. Adding an archetype never touches this file. */}
          {ui ? (
            ui.render({
              loading,
              response,
              spec,
              approved,
              committed: exported,
              run,
              onApprove: approve,
              onCommit: exportPkg,
            })
          ) : (
            <div style={{ color: "var(--color-muted)", fontSize: 13 }}>
              No handler registered for archetype <code>{spec.archetype}</code> yet.
            </div>
          )}
        </section>

        <section
          style={{
            flex: "1 1 420px",
            minWidth: 320,
            background: "color-mix(in oklab, var(--color-panel) 75%, transparent)",
            border: "1px solid var(--color-line)",
            borderRadius: 16,
            padding: "20px 8px 8px 20px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Live System Path {active ? "· running" : done.length > 2 ? "· complete" : ""}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 8, paddingRight: 12 }}>
            The same diagram from the report — lit by the actual request as it runs.
          </div>
          <div style={{ flex: 1, minHeight: 600 }}>
            <ArchitectureFlow flowNodes={flow.nodes} flowEdges={flow.edges} active={active} done={done} />
          </div>
        </section>
      </div>

      <p style={{ fontSize: 11.5, color: "var(--color-muted)", marginTop: 22, maxWidth: 760, lineHeight: 1.5 }}>
        Prototype over a synthetic public-domain corpus. Open substitutes for the production stack:
        pgvector for the vector DB, Transformers.js embeddings for the multi-modal model, a synthetic
        rights ledger, and a mock Rally export. Built from the UC-01 Solution Builder export.
      </p>
    </main>
  );
}
