"use client";

import { useState } from "react";

interface EDoc {
  id: string;
  title: string;
  extractedTerms: { field: string; value: string }[];
  conflicts: string[];
  draft: string;
  status: "clean" | "conflict";
}
export interface ExtractResponse {
  stages: { id: string; label: string; detail: string; ms: number }[];
  unit: string;
  draftKind: string;
  summary: { total: number; conflicts: number; clean: number };
  documents: EDoc[];
}

export default function ExtractPanel({
  loading,
  response,
  docCount,
  unit,
  onRun,
  onApprove,
  onCommit,
  approved,
  committed,
}: {
  loading: boolean;
  response: ExtractResponse | null;
  docCount: number;
  unit: string;
  onRun: () => void;
  onApprove: (n: number) => void;
  onCommit: (pkg: unknown) => void;
  approved: boolean;
  committed: boolean;
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleOpen = (id: string) =>
    setOpen((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const chosen = (response?.documents ?? []).filter((d) => picked.has(d.id));
  const commit = () => {
    const pkg = {
      filed: chosen.map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        conflicts: d.conflicts,
        terms: d.extractedTerms,
        draft: d.draft,
      })),
      signedAt: new Date().toISOString(),
    };
    onCommit(pkg);
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "filed-output.json";
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
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>{docCount} {unit}s in queue</div>
          <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
            Extract terms in parallel, check conflicts, draft for sign-off.
          </div>
        </div>
        <button
          onClick={onRun}
          disabled={loading}
          className="font-mono"
          style={{
            padding: "11px 18px", background: "var(--color-amber)", color: "#1a1205",
            border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12,
            textTransform: "uppercase", letterSpacing: "0.08em",
            cursor: loading ? "wait" : "pointer", opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? "···" : "Run extraction"}
        </button>
      </div>

      {/* summary */}
      {response && (
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          {[
            { k: "Documents", v: response.summary.total, c: "var(--color-fg)" },
            { k: "Conflicts", v: response.summary.conflicts, c: "var(--color-danger)" },
            { k: "Clear", v: response.summary.clean, c: "var(--color-signal)" },
          ].map((s) => (
            <div key={s.k} style={{ flex: 1, background: "var(--color-panel)", border: "1px solid var(--color-line)", borderRadius: 10, padding: "10px 14px" }}>
              <div className="eyebrow">{s.k}</div>
              <div className="font-display" style={{ fontSize: 26, color: s.c, marginTop: 2 }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* documents */}
      <div style={{ marginTop: 16, overflowY: "auto", flex: 1, paddingRight: 4 }}>
        {response?.documents.map((d, i) => {
          const sel = picked.has(d.id);
          const isOpen = open.has(d.id);
          return (
            <div
              key={d.id}
              className="rise"
              style={{
                padding: 12, marginBottom: 10,
                background: sel ? "var(--color-panel-2)" : "var(--color-panel)",
                border: `1px solid ${sel ? "var(--color-signal)" : d.status === "conflict" ? "rgba(255,107,107,0.4)" : "var(--color-line)"}`,
                borderRadius: 12, animationDelay: `${i * 50}ms`,
              }}
            >
              <div onClick={() => toggle(d.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, cursor: "pointer" }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{d.title}</span>
                <span
                  className="font-mono"
                  style={{
                    fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.1em",
                    color: d.status === "conflict" ? "var(--color-danger)" : "var(--color-signal)",
                    border: `1px solid ${d.status === "conflict" ? "var(--color-danger)" : "var(--color-signal)"}`,
                    borderRadius: 4, padding: "1px 6px",
                  }}
                >
                  {d.status}
                </span>
              </div>

              {/* extracted terms */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginTop: 8 }}>
                {d.extractedTerms.slice(0, 6).map((t, j) => (
                  <span key={j} style={{ fontSize: 11.5, color: "var(--color-muted)" }}>
                    {t.field}: <span style={{ color: "var(--color-fg)" }}>{t.value}</span>
                  </span>
                ))}
              </div>

              {/* conflicts */}
              {d.conflicts.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
                  {d.conflicts.map((c) => (
                    <span key={c} style={{ fontSize: 10.5, color: "var(--color-danger)", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 5, padding: "2px 7px" }}>
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {/* draft toggle */}
              <button
                onClick={() => toggleOpen(d.id)}
                className="font-mono"
                style={{ marginTop: 10, background: "transparent", border: "none", color: "var(--color-amber)", fontSize: 11, cursor: "pointer", padding: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}
              >
                {isOpen ? "▾ hide draft" : "▸ view draft"}
              </button>
              {isOpen && (
                <div style={{ marginTop: 8, padding: "10px 12px", background: "var(--color-ink)", border: "1px solid var(--color-line)", borderRadius: 8, fontSize: 12.5, lineHeight: 1.5, color: "var(--color-fg)", opacity: 0.9 }}>
                  {d.draft}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* HITL sign-off + file */}
      {response && response.documents.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 14, borderTop: "1px solid var(--color-line)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Counsel sign-off</div>
            <div style={{ fontSize: 12.5, color: "var(--color-muted)", marginTop: 3 }}>
              {picked.size === 0
                ? "Select drafts to sign off."
                : `${picked.size} selected · ${chosen.filter((d) => d.status === "conflict").length} carry conflicts`}
            </div>
          </div>
          {!approved ? (
            <button
              onClick={() => picked.size > 0 && onApprove(picked.size)}
              disabled={picked.size === 0}
              className="font-mono"
              style={{
                padding: "10px 16px", background: "transparent", border: "1px solid var(--color-signal)",
                color: "var(--color-signal)", borderRadius: 8, fontSize: 12, textTransform: "uppercase",
                letterSpacing: "0.06em", cursor: picked.size === 0 ? "not-allowed" : "pointer", opacity: picked.size === 0 ? 0.4 : 1,
              }}
            >
              Sign off selected
            </button>
          ) : (
            <button
              onClick={commit}
              className="font-mono"
              style={{
                padding: "10px 16px", background: "var(--color-signal)", border: "none", color: "#04211d",
                borderRadius: 8, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer",
              }}
            >
              {committed ? "Filed ✓" : "File outputs"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
