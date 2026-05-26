/**
 * Validate-archetype corpora. Self-contained (no DB) so the demo runs with zero
 * setup. Two clients, two industries, ONE archetype — proof that a single
 * handler serves both. Each carries its records, a deterministic ruleset, and a
 * display mapping. In production these come from the corpus synthesizer
 * (lib/generated/<id>.json); inlined here to run out of the box.
 */

export interface ValidateCorpus {
  title: string;
  unit: string; // what one record is called
  records: Record<string, any>[];
  rules: (r: Record<string, any>) => string[]; // deterministic violations
  display: (r: Record<string, any>) => {
    id: string;
    title: string;
    fields: { label: string; value: string }[];
  };
}

// ---- MV-04 · Specialty materials manufacturing -----------------------------
const mativ: ValidateCorpus = {
  title: "Production lots awaiting yield-excursion triage",
  unit: "lot",
  records: [
    { lotId: "L-4471", product: "Filtration media F2", line: "L3", thicknessUm: 142, tensileMpa: 38, moisturePct: 1.1, tempC: 196, speedMpm: 22 },
    { lotId: "L-4472", product: "Filtration media F2", line: "L3", thicknessUm: 119, tensileMpa: 41, moisturePct: 0.9, tempC: 198, speedMpm: 23 },
    { lotId: "L-4473", product: "Release liner R8", line: "L1", thicknessUm: 88, tensileMpa: 29, moisturePct: 2.7, tempC: 205, speedMpm: 31 },
    { lotId: "L-4474", product: "Release liner R8", line: "L1", thicknessUm: 91, tensileMpa: 30, moisturePct: 1.4, tempC: 203, speedMpm: 30 },
    { lotId: "L-4475", product: "Filtration media F2", line: "L3", thicknessUm: 138, tensileMpa: 22, moisturePct: 1.0, tempC: 197, speedMpm: 22 },
    { lotId: "L-4476", product: "Tape backing T1", line: "L2", thicknessUm: 64, tensileMpa: 52, moisturePct: 0.6, tempC: 188, speedMpm: 40 },
    { lotId: "L-4477", product: "Tape backing T1", line: "L2", thicknessUm: 63, tensileMpa: 51, moisturePct: 0.7, tempC: 214, speedMpm: 41 },
    { lotId: "L-4478", product: "Release liner R8", line: "L1", thicknessUm: 90, tensileMpa: 31, moisturePct: 1.2, tempC: 204, speedMpm: 29 },
    { lotId: "L-4479", product: "Filtration media F2", line: "L3", thicknessUm: 141, tensileMpa: 39, moisturePct: 1.3, tempC: 196, speedMpm: 28 },
    { lotId: "L-4480", product: "Tape backing T1", line: "L2", thicknessUm: 66, tensileMpa: 50, moisturePct: 0.5, tempC: 187, speedMpm: 39 },
  ],
  rules: (r) => {
    const hits: string[] = [];
    const spec: Record<string, [number, number]> = {
      "Filtration media F2": [130, 150], // thickness µm
      "Release liner R8": [85, 95],
      "Tape backing T1": [60, 70],
    };
    const [lo, hi] = spec[r.product] ?? [0, 9999];
    if (r.thicknessUm < lo || r.thicknessUm > hi)
      hits.push(`Thickness ${r.thicknessUm}µm outside spec ${lo}–${hi}`);
    if (r.tensileMpa < 25) hits.push(`Tensile ${r.tensileMpa}MPa below 25 floor`);
    if (r.moisturePct > 2.0) hits.push(`Moisture ${r.moisturePct}% above 2.0 limit`);
    if (r.tempC > 210) hits.push(`Process temp ${r.tempC}°C above 210 ceiling`);
    return hits;
  },
  display: (r) => ({
    id: r.lotId,
    title: `${r.lotId} · ${r.product}`,
    fields: [
      { label: "Line", value: r.line },
      { label: "Thickness", value: `${r.thicknessUm} µm` },
      { label: "Tensile", value: `${r.tensileMpa} MPa` },
      { label: "Moisture", value: `${r.moisturePct}%` },
      { label: "Temp", value: `${r.tempC}°C` },
      { label: "Speed", value: `${r.speedMpm} m/min` },
    ],
  }),
};

// ---- GA-03 · Zoological research (IACUC) -----------------------------------
const aquarium: ValidateCorpus = {
  title: "Animal-care protocols awaiting IACUC pre-review",
  unit: "protocol",
  records: [
    { protocolId: "P-220", species: "Bottlenose dolphin", procedure: "Blood draw", painCategory: "C", anesthesia: "topical", vetReviewed: true, sampleSize: 6, justification: true },
    { protocolId: "P-221", species: "Sea otter", procedure: "Dental surgery", painCategory: "D", anesthesia: "none", vetReviewed: true, sampleSize: 3, justification: true },
    { protocolId: "P-222", species: "Loggerhead turtle", procedure: "Tag implant", painCategory: "D", anesthesia: "general", vetReviewed: false, sampleSize: 12, justification: true },
    { protocolId: "P-223", species: "African penguin", procedure: "Behavioral observation", painCategory: "B", anesthesia: "none", vetReviewed: true, sampleSize: 40, justification: true },
    { protocolId: "P-224", species: "Whale shark", procedure: "Ultrasound", painCategory: "C", anesthesia: "none", vetReviewed: true, sampleSize: 2, justification: false },
    { protocolId: "P-225", species: "Sand tiger shark", procedure: "Biopsy", painCategory: "D", anesthesia: "sedation", vetReviewed: true, sampleSize: 80, justification: true },
    { protocolId: "P-226", species: "Beluga whale", procedure: "Hearing study", painCategory: "C", anesthesia: "none", vetReviewed: true, sampleSize: 4, justification: true },
    { protocolId: "P-227", species: "Sea otter", procedure: "Vaccination", painCategory: "C", anesthesia: "none", vetReviewed: true, sampleSize: 9, justification: true },
  ],
  rules: (r) => {
    const hits: string[] = [];
    const surgical = /surgery|implant|biopsy/i.test(r.procedure);
    if ((r.painCategory === "D" || r.painCategory === "E") && !r.vetReviewed)
      hits.push(`Category ${r.painCategory} requires attending-vet review`);
    if (surgical && (r.anesthesia === "none" || !r.anesthesia))
      hits.push(`Surgical procedure with no anesthesia plan`);
    if (!r.justification) hits.push(`Missing scientific justification`);
    if (r.sampleSize > 50) hits.push(`Sample size ${r.sampleSize} exceeds 50 — needs extra review`);
    return hits;
  },
  display: (r) => ({
    id: r.protocolId,
    title: `${r.protocolId} · ${r.species}`,
    fields: [
      { label: "Procedure", value: r.procedure },
      { label: "Pain cat.", value: r.painCategory },
      { label: "Anesthesia", value: r.anesthesia },
      { label: "Vet reviewed", value: r.vetReviewed ? "yes" : "no" },
      { label: "Sample size", value: String(r.sampleSize) },
      { label: "Justification", value: r.justification ? "yes" : "no" },
    ],
  }),
};

export const VALIDATE_CORPORA: Record<string, ValidateCorpus> = {
  "MV-04": mativ,
  "GA-03": aquarium,
};
