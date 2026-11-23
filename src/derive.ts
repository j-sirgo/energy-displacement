import * as d3 from "d3";
import type { EnergyRow, EnergySource } from "./data";

export const FOSSIL: EnergySource[] = ["coal", "oil", "gas"];
export const LOW_CARBON: EnergySource[] = [
  "nuclear",
  "hydro",
  "solar",
  "wind",
  "biofuel",
  "other_renewable",
];

export type CountryChange = {
  country: string;
  dLowCarbon: number; // TWh, endYear minus startYear
  dFossil: number; // TWh, endYear minus startYear
};

// sum of the given sources for one row; null if any of them is null
const sumSources = (row: EnergyRow, sources: EnergySource[]): number | null => {
  // TODO: return null if any source is null, otherwise their sum
  // (sources.some(...), then d3.sum(sources, (s) => row[s]))
};

// per-country change in low-carbon and fossil TWh between two years
// (World excluded; countries with a missing row or a null source skipped)
export const getCountryChanges = (
  rows: EnergyRow[],
  startYear: number,
  endYear: number,
): CountryChange[] => {
  // TODO:
  // 1. const idx = d3.index(rows, (d) => d.country, (d) => d.year)
  // 2. for each country in idx.keys(), skip "World"
  // 3. look up the startYear and endYear rows; skip if either is missing
  // 4. sumSources for LOW_CARBON and FOSSIL in both rows; skip if any is null
  // 5. push { country, dLowCarbon, dFossil }
};
