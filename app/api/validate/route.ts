import { NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { VALIDATE_CORPORA } from "@/lib/validate-seed";

export const runtime = "nodejs";
export const maxDuration = 60;

const model = anthropic(process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5");

type Stage = { id: string; label: string; detail: string; ms: number };

export async function POST(req: Request) {
  const { demoId } = (await req.json()) as { demoId: string };
  const corpus = VALIDATE_CORPORA[demoId] ?? VALIDATE_CORPORA["MV-04"];

  const stages: Stage[] = [];
  const time = async <T>(id: string, label: string, fn: () => Promise<[T, string]>) => {
    const t0 = Date.now();
    const [v, detail] = await fn();
    stages.push({ id, label, detail, ms: Date.now() - t0 });
    return v;
  };

  // 1. Ingest & normalize.
  const items = await time("ingest", "Ingest & Normalize", async () => {
    const rows = corpus.records.map((r) => ({ record: r, view: corpus.display(r) }));
    return [rows, `${rows.length} ${corpus.unit}s in queue`] as const;
  });

  // 2. Deterministic rules.
  const ruled = await time("rules", "Deterministic Rules", async () => {
    const out = items.map((it) => ({ ...it, ruleHits: corpus.rules(it.record) }));
    const violations = out.filter((x) => x.ruleHits.length > 0).length;
    return [out, `${violations} hard violations`] as const;
  });

  // 3. LLM classifier — risk + reason for every record (one batched call).
  const assessed = await time("classify", "LLM Classifier", async () => {
    try {
      const { object } = await generateObject({
        model,
        schema: z.object({
          assessments: z.array(
            z.object({
              id: z.string(),
              risk: z.enum(["low", "medium", "high"]),
              reason: z.string().describe("<= 14 words: the risk or why it's clean"),
            }),
          ),
        }),
        prompt:
          `You are triaging ${corpus.unit}s for "${corpus.title}". For each, assess risk ` +
          `(consider subtle issues even when no hard rule fired) and give a short reason.\n\n` +
          ruled
            .map(
              (x) =>
                `[${x.view.id}] ${x.view.fields.map((f) => `${f.label}:${f.value}`).join(", ")}` +
                (x.ruleHits.length ? ` | rule hits: ${x.ruleHits.join("; ")}` : ""),
            )
            .join("\n"),
      });
      const map = new Map(object.assessments.map((a) => [a.id, a]));
      return [map, `${object.assessments.length} assessed`] as const;
    } catch {
      const map = new Map(
        ruled.map((x) => [
          x.view.id,
          { id: x.view.id, risk: (x.ruleHits.length ? "high" : "low") as "high" | "low", reason: x.ruleHits[0] ?? "Within parameters" },
        ]),
      );
      return [map, "fallback: rules only"] as const;
    }
  });

  // 4. Flag & score.
  const records = ruled.map((x) => {
    const a = assessed.get(x.view.id);
    const risk = a?.risk ?? (x.ruleHits.length ? "high" : "low");
    const status = x.ruleHits.length > 0 || risk === "high" ? "flag" : "pass";
    return {
      id: x.view.id,
      title: x.view.title,
      fields: x.view.fields,
      ruleHits: x.ruleHits,
      risk,
      reason: a?.reason ?? (x.ruleHits[0] ?? "Within parameters"),
      status,
    };
  });

  // flagged first
  records.sort((a, b) => (a.status === "flag" ? 0 : 1) - (b.status === "flag" ? 0 : 1));

  const flagged = records.filter((r) => r.status === "flag").length;
  stages.push({ id: "flag", label: "Flag & Score", detail: `${flagged} flagged for disposition`, ms: 1 });

  return NextResponse.json({
    stages,
    unit: corpus.unit,
    summary: { total: records.length, flagged, clean: records.length - flagged },
    records,
  });
}
