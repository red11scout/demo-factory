/**
 * Synthetic demo corpus — fully self-contained so `pnpm ingest` runs with zero
 * external calls. Titles are public-domain / generic stand-ins for A+E's
 * unscripted library; scene-beat descriptions are AI-style scene logs (the kind
 * UC-04 would auto-generate); rights rows are invented to exercise the filter.
 *
 * To swap in real open data later: replace this file with a fetch from the
 * Internet Archive API (archive.org/advancedsearch.php) and keep the same shape.
 */

export interface SeedAsset {
  id: string;
  title: string;
  series: string;
  genre: string;
  year: number;
  durationSec: number;
  beats: { beatType: string; startSec: number; endSec: number; description: string }[];
  rights: {
    status: "cleared" | "restricted" | "expired";
    territory: "Worldwide" | "US-only" | "EU-only";
    exclusivity: "none" | "FAST-exclusive";
    expiresOn: string | null;
    note?: string;
  };
}

const ia = (id: string) => `https://archive.org/details/${id}`;
const thumb = (id: string) => `https://picsum.photos/seed/${id}/640/360`;

export const SEED: SeedAsset[] = [
  {
    id: "A001", title: "Tank Battle at Dawn", series: "Frontlines", genre: "War Documentary", year: 2009, durationSec: 2640,
    beats: [
      { beatType: "fight", startSec: 312, endSec: 358, description: "Intense armored firefight between two tank columns across an open field, shells exploding, soldiers ducking for cover under heavy fire." },
      { beatType: "aftermath", startSec: 900, endSec: 945, description: "Smoke clears over a burning battlefield as exhausted troops survey the wreckage in silence." },
      { beatType: "interview", startSec: 1500, endSec: 1560, description: "A veteran recounts the chaos of close-quarters combat, voice breaking as he describes losing his unit." },
      { beatType: "closing line", startSec: 2590, endSec: 2620, description: "Narrator's final words over a sunset: 'They never came home, but the field still remembers their names.'" },
    ],
    rights: { status: "cleared", territory: "Worldwide", exclusivity: "none", expiresOn: null },
  },
  {
    id: "A002", title: "Siege of the Old City", series: "Frontlines", genre: "War Documentary", year: 2011, durationSec: 3120,
    beats: [
      { beatType: "fight", startSec: 410, endSec: 470, description: "Street-to-street urban combat, soldiers exchanging gunfire between bombed-out buildings as a war series captures the assault." },
      { beatType: "rescue", startSec: 1200, endSec: 1250, description: "Medics drag a wounded comrade across rubble while bullets ricochet around them." },
      { beatType: "reunion", startSec: 2700, endSec: 2760, description: "A family reunites in the ruins of their home, embracing through tears after months of separation." },
    ],
    rights: { status: "restricted", territory: "US-only", exclusivity: "none", expiresOn: "2027-03-01", note: "Archival footage licensed for US distribution only." },
  },
  {
    id: "A003", title: "The Verdict Room", series: "True Crime Files", genre: "True Crime", year: 2014, durationSec: 2880,
    beats: [
      { beatType: "reveal", startSec: 600, endSec: 650, description: "Detective unveils the murder weapon in a tense interrogation, the suspect's face falling as the evidence is laid out." },
      { beatType: "confession", startSec: 1800, endSec: 1870, description: "Under pressure, the accused breaks down and confesses to the crime, sobbing into his hands." },
      { beatType: "verdict", startSec: 2750, endSec: 2810, description: "The jury foreman reads a guilty verdict as the courtroom erupts and the defendant collapses." },
    ],
    rights: { status: "cleared", territory: "Worldwide", exclusivity: "none", expiresOn: null },
  },
  {
    id: "A004", title: "Cold Case Reopened", series: "True Crime Files", genre: "True Crime", year: 2016, durationSec: 3000,
    beats: [
      { beatType: "reveal", startSec: 720, endSec: 780, description: "A DNA match flashes on screen, finally connecting the decades-old killer to the crime scene." },
      { beatType: "chase", startSec: 1500, endSec: 1560, description: "Police pursue a fleeing suspect through a parking garage, sirens wailing in the night." },
      { beatType: "closing line", startSec: 2950, endSec: 2980, description: "The lead investigator says quietly, 'Some cases don't close. They just wait for the truth.'" },
    ],
    rights: { status: "cleared", territory: "Worldwide", exclusivity: "FAST-exclusive", expiresOn: null, note: "Reserved for FAST channel premiere window." },
  },
  {
    id: "A005", title: "Pyramids Decoded", series: "Ancient Mysteries", genre: "History", year: 2008, durationSec: 3300,
    beats: [
      { beatType: "reveal", startSec: 900, endSec: 960, description: "Archaeologists open a sealed chamber for the first time in 3,000 years, torchlight revealing golden artifacts." },
      { beatType: "discovery", startSec: 2100, endSec: 2160, description: "A hidden hieroglyph is decoded live, rewriting the timeline of an ancient dynasty." },
    ],
    rights: { status: "expired", territory: "Worldwide", exclusivity: "none", expiresOn: "2024-06-30", note: "License lapsed — requires renegotiation before reuse." },
  },
  {
    id: "A006", title: "Lost Cities of the Jungle", series: "Ancient Mysteries", genre: "History", year: 2012, durationSec: 3180,
    beats: [
      { beatType: "discovery", startSec: 540, endSec: 600, description: "Explorers hack through dense rainforest and stumble upon a stone temple swallowed by vines." },
      { beatType: "storm", startSec: 1700, endSec: 1760, description: "A violent tropical storm batters the dig site as the crew scrambles to protect fragile relics." },
      { beatType: "closing line", startSec: 3120, endSec: 3160, description: "Over a drone shot of the ruins: 'What we bury, time always gives back.'" },
    ],
    rights: { status: "cleared", territory: "EU-only", exclusivity: "none", expiresOn: "2028-12-31", note: "Cleared for EU territories." },
  },
  {
    id: "A007", title: "Storm Chasers: Tornado Alley", series: "Wild Weather", genre: "Reality", year: 2013, durationSec: 2700,
    beats: [
      { beatType: "storm", startSec: 800, endSec: 880, description: "A massive tornado tears across the plains as chasers film from a shaking vehicle, debris flying past the windshield." },
      { beatType: "rescue", startSec: 1900, endSec: 1960, description: "The team pulls a stranded family from a flooded road moments before the water rises." },
    ],
    rights: { status: "cleared", territory: "Worldwide", exclusivity: "none", expiresOn: null },
  },
  {
    id: "A008", title: "Deadliest Catch of the Season", series: "Wild Weather", genre: "Reality", year: 2015, durationSec: 2940,
    beats: [
      { beatType: "storm", startSec: 1100, endSec: 1180, description: "Giant waves crash over a fishing boat in a North Sea gale, crew clinging to the rails." },
      { beatType: "argument", startSec: 2000, endSec: 2060, description: "Two crewmates erupt into a heated shouting match on deck over a dangerous decision." },
      { beatType: "reunion", startSec: 2880, endSec: 2920, description: "The captain embraces his son on the dock after the most dangerous voyage of his career." },
    ],
    rights: { status: "cleared", territory: "Worldwide", exclusivity: "none", expiresOn: null },
  },
  {
    id: "A009", title: "First Dance", series: "Wedding Stories", genre: "Reality", year: 2017, durationSec: 1800,
    beats: [
      { beatType: "first kiss", startSec: 420, endSec: 460, description: "The couple shares their first kiss as newlyweds under a canopy of string lights, guests cheering." },
      { beatType: "reunion", startSec: 1100, endSec: 1150, description: "A soldier surprises the bride mid-reception, the room gasping as her brother returns from deployment." },
      { beatType: "closing line", startSec: 1760, endSec: 1790, description: "The bride whispers to camera, 'This is the day everything finally made sense.'" },
    ],
    rights: { status: "cleared", territory: "Worldwide", exclusivity: "none", expiresOn: null },
  },
  {
    id: "A010", title: "Restoration Workshop", series: "Built to Last", genre: "Lifestyle", year: 2018, durationSec: 2520,
    beats: [
      { beatType: "reveal", startSec: 1900, endSec: 1980, description: "A rusted classic car is unveiled fully restored, the owner speechless and tearing up at the transformation." },
      { beatType: "argument", startSec: 1000, endSec: 1060, description: "The crew clashes over budget overruns as a restoration deadline looms." },
    ],
    rights: { status: "restricted", territory: "US-only", exclusivity: "none", expiresOn: "2026-09-15", note: "Music cue uncleared outside US." },
  },
  {
    id: "A011", title: "Edge of the Summit", series: "Against the Mountain", genre: "Adventure", year: 2010, durationSec: 3360,
    beats: [
      { beatType: "rescue", startSec: 2200, endSec: 2280, description: "A climber dangles over a crevasse and is hauled to safety in a heart-stopping high-altitude rescue." },
      { beatType: "storm", startSec: 1400, endSec: 1470, description: "A whiteout blizzard traps the expedition near the peak as oxygen runs low." },
      { beatType: "closing line", startSec: 3300, endSec: 3340, description: "At base camp the leader reflects: 'The mountain doesn't care who you are. That's why we climb it.'" },
    ],
    rights: { status: "cleared", territory: "Worldwide", exclusivity: "none", expiresOn: null },
  },
  {
    id: "A012", title: "Boardroom Showdown", series: "The Pitch", genre: "Business Reality", year: 2019, durationSec: 2640,
    beats: [
      { beatType: "argument", startSec: 800, endSec: 870, description: "Two executives face off in a tense boardroom confrontation over a hostile takeover bid." },
      { beatType: "reveal", startSec: 1900, endSec: 1970, description: "An entrepreneur reveals surprise revenue numbers, flipping the investors' skepticism into a bidding war." },
      { beatType: "closing line", startSec: 2600, endSec: 2630, description: "The host signs off: 'In this room, the only currency that matters is nerve.'" },
    ],
    rights: { status: "cleared", territory: "Worldwide", exclusivity: "FAST-exclusive", expiresOn: null, note: "Held for FAST channel launch." },
  },
];
