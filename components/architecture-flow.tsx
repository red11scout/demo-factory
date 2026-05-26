"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { FlowNodeSpec } from "@/lib/demo-spec";

type State = "idle" | "active" | "done";
type StageData = {
  idx: number;
  label: string;
  sublabel: string;
  prodComponent: string;
  state: State;
};

function StageNode({ data }: NodeProps) {
  const d = data as unknown as StageData;
  const border =
    d.state === "active"
      ? "var(--color-signal)"
      : d.state === "done"
        ? "var(--color-signal-dim)"
        : "var(--color-line)";
  const accent =
    d.state === "active"
      ? "var(--color-signal)"
      : d.state === "done"
        ? "var(--color-signal)"
        : "var(--color-muted)";
  return (
    <div
      className={d.state === "active" ? "node-active" : ""}
      style={{
        width: 286,
        background: d.state === "idle" ? "var(--color-panel)" : "var(--color-panel-2)",
        border: `1px solid ${border}`,
        borderRadius: 10,
        padding: "10px 13px",
        opacity: d.state === "idle" ? 0.62 : 1,
        transition: "all 0.3s ease",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span
          className="font-mono"
          style={{
            fontSize: 10,
            color: accent,
            border: `1px solid ${border}`,
            borderRadius: 4,
            padding: "1px 5px",
          }}
        >
          {String(d.idx).padStart(2, "0")}
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>
          {d.label}
        </span>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--color-muted)", marginTop: 3 }}>
        {d.sublabel}
      </div>
      <div
        className="font-mono"
        style={{ fontSize: 9.5, color: "var(--color-amber-dim)", marginTop: 5 }}
      >
        PRD · {d.prodComponent}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes = { stage: StageNode };

export default function ArchitectureFlow({
  flowNodes,
  flowEdges,
  active,
  done,
}: {
  flowNodes: FlowNodeSpec[];
  flowEdges: { source: string; target: string }[];
  active: string | null;
  done: string[];
}) {
  const doneSet = useMemo(() => new Set(done), [done]);

  const nodes: Node[] = useMemo(
    () =>
      flowNodes.map((n, i) => {
        const state: State =
          active === n.id ? "active" : doneSet.has(n.id) ? "done" : "idle";
        return {
          id: n.id,
          type: "stage",
          position: { x: 20, y: i * 92 },
          data: {
            idx: i + 1,
            label: n.label,
            sublabel: n.sublabel,
            prodComponent: n.prodComponent,
            state,
          },
          draggable: false,
          selectable: false,
        };
      }),
    [active, doneSet],
  );

  const edges: Edge[] = useMemo(
    () =>
      flowEdges.map((e) => {
        const lit = active === e.target || (doneSet.has(e.source) && doneSet.has(e.target));
        return {
          id: `${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          type: "smoothstep",
          animated: active === e.target,
          style: {
            stroke: lit ? "var(--color-signal)" : "var(--color-line)",
            strokeWidth: lit ? 2 : 1.25,
          },
        };
      }),
    [active, doneSet],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.12 }}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      panOnScroll
      zoomOnScroll={false}
      minZoom={0.4}
      maxZoom={1.2}
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--color-line)" />
    </ReactFlow>
  );
}
