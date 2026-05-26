import { NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { EXTRACT_CORPORA } from "@/lib/extract-seed";

export const runtime = "nodejs";
export const maxDuration = 60;

const model = anthropic(process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5");
type Stage = { id: string; label: string; detail: string; ms: number };

const termsSchema = z.object({
  terms: z.array(z.object({ field: z.string(), value: z.string() })),
});

export async function POST(req: Request) {
  const { demoId } = (await req.json()) as { demoId: string };
  const corpus = EXTRACT_CORPORA[demoId] ?? EXTRACT_CORPORA["PRT-02"];

  const stages: Stage[] = [];
  const time = async <T>(id: string, label: string, fn: () => Promise<[T, string]>) => {
    const t0 = Date.now();
    const [v, detail] = await fn();
    stages.push({ id, label, detail, ms: Date.now() - t0 });
    return v;
  };

  // 1. EXTRACT — orchestrator fans out one worker per document, in parallel.
  const extracted = await time("extract", "Extract Terms", async () => {
    const out = await Promise.all(
      corpus.documents.map(async (doc) => {
        try {
          const { object } = await generateObject({
            model,
            schema: termsSchema,
            prompt:
              `Extract these fields as field/value pairs from the ${corpus.unit} below. ` +
              `Fields: ${corpus.extractFields}.\n\n${doc.sourceText}`,
          });
          return { doc, terms: object.terms };
        } catch {
          return { doc, terms: [{ field: "extraction", value: "unavailable" }] };
        }
      }),
    );
    return [out, `${out.length} workers · parallel`] as const;
  });

  // 2. CONFLICT — deterministic check against the registry.
  const checked = await time("conflict", "Conflict Check", async () => {
    const out = extracted.map((e) => ({
      ...e,
      conflicts: corpus.checkConflicts(e.doc.attrs, corpus.registry),
    }));
    const n = out.filter((x) => x.conflicts.length > 0).length;
    return [out, `${n} of ${out.length} with conflicts`] as const;
  });

  // 3. DRAFT — generate the deliverable per document (parallel).
  const drafted = await time("draft", "Draft Output", async () => {
    const out = await Promise.all(
      checked.map(async (c) => {
        try {
          const { text } = await generateText({
            model,
            prompt:
              `Write a concise ${corpus.draftKind} (≈3 sentences) for "${c.doc.title}". ` +
              `Extracted terms: ${c.terms.map((t) => `${t.field}: ${t.value}`).join("; ")}. ` +
              (c.conflicts.length
                ? `Flag these issues clearly for counsel: ${c.conflicts.join("; ")}.`
                : `No conflicts found; note it is clear for sign-off.`),
          });
          return { ...c, draft: text.trim() };
        } catch {
          return { ...c, draft: "Draft unavailable — retry." };
        }
      }),
    );
    return [out, `${out.length} drafts`] as const;
  });

  const documents = drafted.map((d) => ({
    id: d.doc.id,
    title: d.doc.title,
    extractedTerms: d.terms,
    conflicts: d.conflicts,
    draft: d.draft,
    status: d.conflicts.length > 0 ? "conflict" : "clean",
  }));
  documents.sort((a, b) => (a.status === "conflict" ? 0 : 1) - (b.status === "conflict" ? 0 : 1));

  const conflicts = documents.filter((d) => d.status === "conflict").length;
  return NextResponse.json({
    stages,
    unit: corpus.unit,
    draftKind: corpus.draftKind,
    summary: { total: documents.length, conflicts, clean: documents.length - conflicts },
    documents,
  });
}
