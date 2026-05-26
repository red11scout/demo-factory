"use client";

import { useState } from "react";
import type { SearchResponse, SearchResult } from "@/lib/types";
import { EXAMPLE_QUERIES } from "@/lib/types";

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function RightsBadge({ r }: { r: SearchResult["rights"] }) {
  const map: Record<string, { c: string; t: string }> = {
    cleared: { c: "var(--color-signal)", t: "Cleared" },
    restricted: { c: "var(--color-amber)", t: "Restricted" },
    expired: { c: "var(--color-danger)", t: "Expired" },
  };
  const s = map[r.status] ?? map.restricted;
  return (
    <span
      className="font-mono"
      style={{
        fontSize: 9.5,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: s.c,
        border: `1px solid ${s.c}`,
        borderRadius: 4,
        padding: "1px 6px",
      }}
      title={r.note ?? undefined}
    >
      {s.t} · {r.territory}
    </span>
  );
}

export default function SearchPanel({
  loading,
  response,
  onSearch,
  onApprove,
  onExport,
  approved,
  exported,
}: {
  loading: boolean;
  response: SearchResponse | null;
  onSearch: (q: string) => void;
  onApprove: (count: number) => void;
  onExport: (pkg: unknown) => void;
  approved: boolean;
  exported: boolean;
}) {
  const [q, setQ] = useState("");
  const [shortlist, setShortlist] = useState<Set<string>>(new Set());

  const submit = (query: string) => {
    setShortlist(new Set());
    setQ(query);
    onSearch(query);
  };

  const toggle = (id: string) => {
    setShortlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const chosen = (response?.results ?? []).filter((r) => shortlist.has(r.id));
  const exportPackage = () => {
    const pkg = {
      package: "SDVI Rally export (mock)",
      useCase: "UC-01",
      generatedAt: new Date().toISOString(),
      clips: chosen.map((r) => ({
        assetId: r.assetId,
        title: r.title,
        in: fmtTime(r.startSec),
        out: fmtTime(r.endSec),
        beat: r.beatType,
        rights: r.rights,
      })),
    };
    onExport(pkg);
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rally-package.json";
    a.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* search box */}
      <div style={{ position: "relative" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && q.trim() && submit(q)}
          placeholder="Search the library in plain language…"
          style={{
            width: "100%",
            background: "var(--color-panel)",
            border: "1px solid var(--color-line)",
            borderRadius: 12,
            padding: "15px 110px 15px 18px",
            color: "var(--color-fg)",
            fontSize: 15,
            outline: "none",
          }}
        />
        <button
          onClick={() => q.trim() && submit(q)}
          disabled={loading || !q.trim()}
          className="font-mono"
          style={{
            position: "absolute",
            right: 7,
            top: 7,
            bottom: 7,
            padding: "0 18px",
            background: "var(--color-amber)",
            color: "#1a1205",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            cursor: loading ? "wait" : "pointer",
            opacity: loading || !q.trim() ? 0.5 : 1,
          }}
        >
          {loading ? "···" : "Search"}
        </button>
      </div>

      {/* example chips */}
      {!response && !loading && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {EXAMPLE_QUERIES.map((ex) => (
            <button
              key={ex}
              onClick={() => submit(ex)}
              style={{
                background: "transparent",
                border: "1px solid var(--color-line)",
                color: "var(--color-muted)",
                borderRadius: 20,
                padding: "6px 13px",
                fontSize: 12.5,
                cursor: "pointer",
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* intent readout */}
      {response && (
        <div
          className="font-mono"
          style={{
            marginTop: 14,
            fontSize: 11,
            color: "var(--color-muted)",
            borderLeft: "2px solid var(--color-signal-dim)",
            paddingLeft: 10,
          }}
        >
          parsed → "{response.intent.semanticQuery}"
          {response.intent.beatType ? ` · beat:${response.intent.beatType}` : ""}
          {response.intent.yearFrom
            ? ` · ${response.intent.yearFrom}–${response.intent.yearTo}`
            : ""}
        </div>
      )}

      {/* results */}
      <div style={{ marginTop: 16, overflowY: "auto", flex: 1, paddingRight: 4 }}>
        {response?.results.map((r, i) => {
          const sel = shortlist.has(r.id);
          return (
            <div
              key={r.id}
              className="rise"
              onClick={() => toggle(r.id)}
              style={{
                display: "flex",
                gap: 13,
                padding: 11,
                marginBottom: 10,
                background: sel ? "var(--color-panel-2)" : "var(--color-panel)",
                border: `1px solid ${sel ? "var(--color-signal)" : "var(--color-line)"}`,
                borderRadius: 12,
                cursor: "pointer",
                animationDelay: `${i * 60}ms`,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 132,
                  height: 74,
                  flexShrink: 0,
                  borderRadius: 7,
                  overflow: "hidden",
                  background: "var(--color-ink)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.thumbnailUrl}
                  alt={r.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                />
                <span
                  className="font-mono"
                  style={{
                    position: "absolute",
                    bottom: 4,
                    right: 4,
                    fontSize: 9,
                    background: "rgba(0,0,0,0.7)",
                    padding: "1px 4px",
                    borderRadius: 3,
                    color: "var(--color-fg)",
                  }}
                >
                  {fmtTime(r.startSec)}–{fmtTime(r.endSec)}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600 }}>{r.title}</span>
                  <span className="font-mono" style={{ fontSize: 10, color: "var(--color-signal)" }}>
                    {(r.score * 100).toFixed(0)}%
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--color-muted)", margin: "2px 0 5px" }}>
                  {r.series} · {r.genre} · {r.year} · <span className="font-mono">{r.beatType}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--color-fg)", opacity: 0.82, lineHeight: 1.4 }}>
                  {r.description}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
                  <RightsBadge r={r.rights} />
                  <span style={{ fontSize: 11, color: "var(--color-amber-dim)", fontStyle: "italic" }}>
                    {r.reason}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* HITL gate + export */}
      {response && response.results.length > 0 && (
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
            <div className="eyebrow">Human-in-the-loop gate</div>
            <div style={{ fontSize: 12.5, color: "var(--color-muted)", marginTop: 3 }}>
              {shortlist.size === 0
                ? "Select clips to build a shortlist."
                : `${shortlist.size} clip${shortlist.size > 1 ? "s" : ""} selected · ${
                    chosen.filter((r) => !r.clearable).length
                  } need clearance`}
            </div>
          </div>
          {!approved ? (
            <button
              onClick={() => shortlist.size > 0 && onApprove(shortlist.size)}
              disabled={shortlist.size === 0}
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
                cursor: shortlist.size === 0 ? "not-allowed" : "pointer",
                opacity: shortlist.size === 0 ? 0.4 : 1,
              }}
            >
              Validate shortlist
            </button>
          ) : (
            <button
              onClick={exportPackage}
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
              {exported ? "Exported ✓" : "Export to Rally"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
