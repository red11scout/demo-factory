"use client";

import { useState } from "react";

interface VRecord {
  id: string;
  title: string;
  fields: { label: string; value: string }[];
  ruleHits: string[];
  risk: "low" | "medium" | "high";
  reason: string;
  status: "pass" | "flag";
}
export interface ValidateResponse {
  stages: { id: string; label: string; detail: string; ms: number }[];
  unit: string;
  summary: { total: number; flagged: number; clean: number };
  records: VRecord[];
}

const RISK: Record<string, string> = {
  low: "var(--color-signal)",
  medium: "var(--color-amber)",
  high: "var(--color-danger)",
};

export default function ValidatePanel({
  loading,
  response,
  recordCount,
  unit,
  onRun,
  onApprove,
  onCommit,
  approved,
  committed,
}: {
  loading: boolean;
  response: ValidateResponse | null;
  recordCount: number;
  unit: string;
  onRun: () => void;
  onApprove: (n: number) => void;
  onCommit: (pkg: unknown) => void;
  approved: boolean;
  committed: boolean;
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const chosen = (response?.records ?? []).filter((r) => picked.has(r.id));
  const commit = () => {
    const pkg = {
      decisions: chosen.map((r) => ({
        id: r.id,
        decision: r.status === "flag" ? "HOLD" : "RELEASE",
        risk: r.risk,
        ruleHits: r.ruleHits,
        reason: r.reason,
      })),
      decidedAt: new Date().toISOString(),
    };
    onCommit(pkg);
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "dispositions.json";
    a.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* run bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          background: "var(--color-panel)",
          border: "1px solid var(--color-line)",
          borderRadius: 12,
          padding: "14px 16px",
        }}
      >
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>
            {recordCount} {unit}s in queue
          </div>
          <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
            Run rules + AI triage before release.
          </div>
        </div>
        <button
          onClick={onRun}
          disabled={loading}
          className="font-mono"
          style={{
            padding: "11px 18px",
            background: "var(--color-amber)",
            color: "#1a1205",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? "···" : "Run validation"}
        </button>
      </div>

      {/* summary */}
      {response && (
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          {[
            { k: "Total", v: response.summary.total, c: "var(--color-fg)" },
            { k: "Flagged", v: response.summary.flagged, c: "var(--color-danger)" },
            { k: "Clean", v: response.summary.clean, c: "var(--color-signal)" },
          ].map((s) => (
            <div
              key={s.k}
              style={{
                flex: 1,
                background: "var(--color-panel)",
                border: "1px solid var(--color-line)",
                borderRadius: 10,
                padding: "10px 14px",
              }}
            >
              <div className="eyebrow">{s.k}</div>
              <div className="font-display" style={{ fontSize: 26, color: s.c, marginTop: 2 }}>
                {s.v}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* records */}
      <div style={{ marginTop: 16, overflowY: "auto", flex: 1, paddingRight: 4 }}>
        {response?.records.map((r, i) => {
          const sel = picked.has(r.id);
          return (
            <div
              key={r.id}
              className="rise"
              onClick={() => toggle(r.id)}
              style={{
                padding: 12,
                marginBottom: 10,
                background: sel ? "var(--color-panel-2)" : "var(--color-panel)",
                border: `1px solid ${sel ? "var(--color-signal)" : r.status === "flag" ? "rgba(255,107,107,0.4)" : "var(--color-line)"}`,
                borderRadius: 12,
                cursor: "pointer",
                animationDelay: `${i * 50}ms`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{r.title}</span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span
                    className="font-mono"
                    style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.1em", color: RISK[r.risk] }}
                  >
                    {r.risk} risk
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 9.5,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: r.status === "flag" ? "var(--color-danger)" : "var(--color-signal)",
                      border: `1px solid ${r.status === "flag" ? "var(--color-danger)" : "var(--color-signal)"}`,
                      borderRadius: 4,
                      padding: "1px 6px",
                    }}
                  >
                    {r.status}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", margin: "8px 0 0" }}>
                {r.fields.map((f) => (
                  <span key={f.label} style={{ fontSize: 11.5, color: "var(--color-muted)" }}>
                    {f.label}: <span style={{ color: "var(--color-fg)" }}>{f.value}</span>
                  </span>
                ))}
              </div>

              {r.ruleHits.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
                  {r.ruleHits.map((h) => (
                    <span
                      key={h}
                      style={{
                        fontSize: 10.5,
                        color: "var(--color-danger)",
                        background: "rgba(255,107,107,0.08)",
                        border: "1px solid rgba(255,107,107,0.3)",
                        borderRadius: 5,
                        padding: "2px 7px",
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 11.5, color: "var(--color-amber-dim)", fontStyle: "italic", marginTop: 8 }}>
                {r.reason}
              </div>
            </div>
          );
        })}
      </div>

      {/* HITL disposition + commit */}
      {response && response.records.length > 0 && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 14,
            borderTop: "1px solid var(--color-line)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Human-in-the-loop disposition</div>
            <div style={{ fontSize: 12.5, color: "var(--color-muted)", marginTop: 3 }}>
              {picked.size === 0
                ? "Select records to disposition."
                : `${picked.size} selected · ${chosen.filter((r) => r.status === "flag").length} will be held`}
            </div>
          </div>
          {!approved ? (
            <button
              onClick={() => picked.size > 0 && onApprove(picked.size)}
              disabled={picked.size === 0}
              className="font-mono"
              style={{
                padding: "10px 16px",
                background: "transparent",
                border: "1px solid var(--color-signal)",
                color: "var(--color-signal)",
                borderRadius: 8,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                cursor: picked.size === 0 ? "not-allowed" : "pointer",
                opacity: picked.size === 0 ? 0.4 : 1,
              }}
            >
              Disposition selected
            </button>
          ) : (
            <button
              onClick={commit}
              className="font-mono"
              style={{
                padding: "10px 16px",
                background: "var(--color-signal)",
                border: "none",
                color: "#04211d",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                cursor: "pointer",
              }}
            >
              {committed ? "Committed ✓" : "Commit decisions"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
