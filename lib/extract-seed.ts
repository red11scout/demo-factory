/**
 * Extract-and-draft corpora. Self-contained (no DB). Two clients, two
 * industries, one orchestrator-worker handler.
 *
 * Each document carries `sourceText` (what the parallel extraction workers read,
 * via Claude) and `attrs` (planted structured ground-truth used for the
 * deterministic conflict check against `registry`). Extraction is real; conflict
 * detection is reliable. Some documents are planted with conflicts/expiries so
 * the registry check and human sign-off visibly do work.
 */

export interface ExtractCorpus {
  title: string;
  unit: string;
  draftKind: string;
  /** field list handed to the extraction workers */
  extractFields: string;
  registry: Record<string, any>[];
  documents: { id: string; title: string; sourceText: string; attrs: Record<string, any> }[];
  checkConflicts: (attrs: Record<string, any>, registry: Record<string, any>[]) => string[];
}

const today = "2026-05-26";
const past = (d: string) => d < today;

// ---- PRT-02 · Commercial real estate (leases) ------------------------------
const piedmont: ExtractCorpus = {
  title: "Lease agreements awaiting abstraction & clause-risk review",
  unit: "lease",
  draftKind: "lease abstract",
  extractFields:
    "tenant, premises, base rent, lease term (start–end), renewal option, exclusive-use clause, permitted use, assignment rights",
  registry: [
    { tenant: "Cafe Verde", property: "Northgate Plaza", useType: "food service", exclusiveUse: true },
    { tenant: "FitZone Gym", property: "Maple Commons", useType: "fitness", exclusiveUse: true },
    { tenant: "BookNook", property: "Riverside Center", useType: "retail", exclusiveUse: false },
  ],
  documents: [
    {
      id: "L-EAST-12", title: "Bean & Brew — Northgate Plaza",
      sourceText:
        "This Lease is made between Landlord and Bean & Brew LLC for Suite 120 at Northgate Plaza, comprising 1,850 sq ft. Base rent is $4,200/month with 3% annual escalation. Term commences 2026-07-01 and expires 2031-06-30. Tenant shall have one five-year renewal option exercisable by 2030-12-31. Tenant is granted the exclusive right to operate a coffee and food-service establishment within the property. Premises shall be used solely for food service. Assignment requires Landlord consent.",
      attrs: { tenant: "Bean & Brew", property: "Northgate Plaza", useType: "food service", exclusiveUse: true, termEnd: "2031-06-30", renewalDeadline: "2030-12-31" },
    },
    {
      id: "L-EAST-19", title: "TechHub Coworking — Maple Commons",
      sourceText:
        "Landlord leases to TechHub Coworking Inc. the 6,400 sq ft second floor of Maple Commons. Base rent $11,800/month, term 2026-09-01 through 2033-08-31, with two three-year renewals. Permitted use: general office and coworking. No exclusive-use rights are granted. Tenant may sublease with notice.",
      attrs: { tenant: "TechHub Coworking", property: "Maple Commons", useType: "office", exclusiveUse: false, termEnd: "2033-08-31", renewalDeadline: "2033-02-28" },
    },
    {
      id: "L-WEST-03", title: "Iron Forge Fitness — Maple Commons",
      sourceText:
        "This agreement leases Unit 4 at Maple Commons (4,100 sq ft) to Iron Forge Fitness LLC. Base rent $7,500/month, term 2026-08-01 to 2032-07-31. Tenant is granted exclusive use as a fitness and health club within the property. One five-year renewal by 2032-01-31. Assignment prohibited without consent.",
      attrs: { tenant: "Iron Forge Fitness", property: "Maple Commons", useType: "fitness", exclusiveUse: true, termEnd: "2032-07-31", renewalDeadline: "2032-01-31" },
    },
    {
      id: "L-WEST-07", title: "Sunrise Diner — Lakeview Walk",
      sourceText:
        "Landlord and Sunrise Diner Inc. for 2,200 sq ft at Lakeview Walk. Base rent $3,900/month. Term 2019-01-01 through 2024-12-31. Permitted use: restaurant. Renewal option expired. Assignment with consent.",
      attrs: { tenant: "Sunrise Diner", property: "Lakeview Walk", useType: "food service", exclusiveUse: false, termEnd: "2024-12-31", renewalDeadline: "2024-06-30" },
    },
    {
      id: "L-NORTH-21", title: "Pet Palace — Riverside Center",
      sourceText:
        "Lease for Pet Palace LLC, Suite 8 Riverside Center, 3,000 sq ft. Base rent $5,100/month. Term 2022-03-01 to 2027-02-28. One renewal option that must be exercised by 2026-02-28. Permitted use: retail pet supply. Non-exclusive.",
      attrs: { tenant: "Pet Palace", property: "Riverside Center", useType: "retail", exclusiveUse: false, termEnd: "2027-02-28", renewalDeadline: "2026-02-28" },
    },
    {
      id: "L-NORTH-25", title: "Green Thumb Garden — Hillside Square",
      sourceText:
        "Landlord leases to Green Thumb Garden Co. 5,200 sq ft at Hillside Square. Base rent $6,400/month, term 2026-10-01 through 2034-09-30, two five-year renewals. Permitted use: garden center and nursery. No exclusivity. Assignment permitted with consent.",
      attrs: { tenant: "Green Thumb Garden", property: "Hillside Square", useType: "garden center", exclusiveUse: false, termEnd: "2034-09-30", renewalDeadline: "2034-03-31" },
    },
  ],
  checkConflicts: (a, registry) => {
    const hits: string[] = [];
    if (a.exclusiveUse) {
      const clash = registry.find(
        (r) => r.property === a.property && r.useType === a.useType && r.exclusiveUse,
      );
      if (clash) hits.push(`Exclusive-use conflict with ${clash.tenant} (${a.useType}, same property)`);
    }
    if (past(a.termEnd)) hits.push(`Lease term expired ${a.termEnd}`);
    if (past(a.renewalDeadline)) hits.push(`Renewal window lapsed ${a.renewalDeadline}`);
    return hits;
  },
};

// ---- AE-02 · Entertainment (rights licensing) ------------------------------
const aeLicensing: ExtractCorpus = {
  title: "Licensing deals awaiting rights-aware proposal drafting",
  unit: "deal",
  draftKind: "licensing proposal",
  extractFields:
    "title, licensee, territory, exclusivity, license window (start–end), platform, talent/music clearance status",
  registry: [
    { title: "Frontlines: Season 3", licensee: "StreamCo", territory: "US", exclusive: true, windowEnd: "2027-01-01" },
    { title: "True Crime Files", licensee: "FAST Network A", territory: "Worldwide", exclusive: false, windowEnd: "2028-06-30" },
  ],
  documents: [
    {
      id: "D-101", title: "Frontlines: Season 3 → GlobalTV",
      sourceText:
        "Proposed license of 'Frontlines: Season 3' to GlobalTV for US territory, exclusive AVOD rights, window 2026-08-01 to 2029-07-31. All talent and archival-footage clearances confirmed current.",
      attrs: { title: "Frontlines: Season 3", licensee: "GlobalTV", territory: "US", exclusive: true, windowStart: "2026-08-01", windowEnd: "2029-07-31", clearance: "current" },
    },
    {
      id: "D-102", title: "Ancient Mysteries → EduStream",
      sourceText:
        "Proposed license of 'Ancient Mysteries' to EduStream for EU territory, non-exclusive SVOD, window 2026-09-01 to 2028-08-31. Music clearance lapsed 2024-06-30 and requires renegotiation.",
      attrs: { title: "Ancient Mysteries", licensee: "EduStream", territory: "EU", exclusive: false, windowStart: "2026-09-01", windowEnd: "2028-08-31", clearance: "expired" },
    },
    {
      id: "D-103", title: "Wild Weather → FAST Network B",
      sourceText:
        "Proposed license of 'Wild Weather' to FAST Network B, US territory, non-exclusive FAST, window 2026-07-01 to 2029-06-30. Clearances current.",
      attrs: { title: "Wild Weather", licensee: "FAST Network B", territory: "US", exclusive: false, windowStart: "2026-07-01", windowEnd: "2029-06-30", clearance: "current" },
    },
    {
      id: "D-104", title: "True Crime Files → AVOD Co",
      sourceText:
        "Proposed license of 'True Crime Files' to AVOD Co, US territory, EXCLUSIVE AVOD, window 2026-10-01 to 2029-09-30. Clearances current.",
      attrs: { title: "True Crime Files", licensee: "AVOD Co", territory: "US", exclusive: true, windowStart: "2026-10-01", windowEnd: "2029-09-30", clearance: "current" },
    },
    {
      id: "D-105", title: "The Pitch → BizStream",
      sourceText:
        "Proposed license of 'The Pitch' to BizStream, Worldwide, non-exclusive SVOD, window 2026-11-01 to 2030-10-31. Clearances current.",
      attrs: { title: "The Pitch", licensee: "BizStream", territory: "Worldwide", exclusive: false, windowStart: "2026-11-01", windowEnd: "2030-10-31", clearance: "current" },
    },
    {
      id: "D-106", title: "Wedding Stories → LifeChannel",
      sourceText:
        "Proposed license of 'Wedding Stories' to LifeChannel, US territory, non-exclusive FAST, window 2026-08-15 to 2028-08-14. Clearances current.",
      attrs: { title: "Wedding Stories", licensee: "LifeChannel", territory: "US", exclusive: false, windowStart: "2026-08-15", windowEnd: "2028-08-14", clearance: "current" },
    },
  ],
  checkConflicts: (a, registry) => {
    const hits: string[] = [];
    const overlapTerritory = (x: string, y: string) =>
      x === y || x === "Worldwide" || y === "Worldwide";
    for (const r of registry) {
      if (r.title !== a.title) continue;
      const territoryOverlap = overlapTerritory(r.territory, a.territory);
      const exclusiveEither = r.exclusive || a.exclusive;
      const windowOverlap = a.windowStart <= r.windowEnd;
      if (territoryOverlap && exclusiveEither && windowOverlap)
        hits.push(`Over-grant conflict with ${r.licensee} (${r.territory}, overlapping window)`);
    }
    if (a.clearance === "expired") hits.push(`Talent/music clearance expired — renegotiation required`);
    return hits;
  },
};

export const EXTRACT_CORPORA: Record<string, ExtractCorpus> = {
  "PRT-02": piedmont,
  "AE-02": aeLicensing,
};
