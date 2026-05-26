export interface SearchResult {
  id: string;
  assetId: string;
  title: string;
  series: string;
  genre: string;
  year: number;
  beatType: string;
  startSec: number;
  endSec: number;
  description: string;
  thumbnailUrl: string;
  sourceUrl: string;
  score: number;
  rights: {
    status: string;
    territory: string;
    exclusivity: string;
    expiresOn: string | null;
    note: string | null;
  };
  clearable: boolean;
  reason: string;
}

export interface SearchResponse {
  intent: {
    semanticQuery: string;
    beatType: string | null;
    yearFrom: number | null;
    yearTo: number | null;
    territory: string | null;
  };
  stages: { id: string; label: string; detail: string; ms: number }[];
  results: SearchResult[];
}

export const EXAMPLE_QUERIES = [
  "every fight scene from a war series shot 2008–2012",
  "an emotional reunion between family members",
  "the moment a suspect confesses on camera",
  "a dramatic first kiss at a wedding",
  "boats caught in a violent storm at sea",
];
