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
  // d3.sum silently skips nulls (it would treat them as 0), so check first
  if (sources.some((s) => row[s] === null)) return null;
  return d3.sum(sources, (s) => row[s]);
};

// per-country change in low-carbon and fossil TWh between two years
// (World excluded; countries with a missing row or a null source skipped)
export const getCountryChanges = (
  rows: EnergyRow[],
  startYear: number,
  endYear: number,
): CountryChange[] => {
  // nested lookup: country -> year -> row
  const idx = d3.index(rows, (d) => d.country, (d) => d.year);
  const changes: CountryChange[] = [];

  for (const [country, byYear] of idx) {
    if (country === "World") continue;

    const start = byYear.get(startYear);
    const end = byYear.get(endYear);
    if (!start || !end) continue;

    const lowStart = sumSources(start, LOW_CARBON);
    const lowEnd = sumSources(end, LOW_CARBON);
    const fossilStart = sumSources(start, FOSSIL);
    const fossilEnd = sumSources(end, FOSSIL);
    if (lowStart === null || lowEnd === null || fossilStart === null || fossilEnd === null) continue;

    changes.push({
      country,
      dLowCarbon: lowEnd - lowStart,
      dFossil: fossilEnd - fossilStart,
    });
  }

  return changes;
};

export const ALL_SOURCES: EnergySource[] = [...FOSSIL, ...LOW_CARBON];

export type FossilDecomposition = {
  startYear: number;
  endYear: number;
  dFossil: number; // TWh, total change in fossil energy
  demandEffect: number; // TWh, from growth in total energy
  mixEffect: number; // TWh, from the change in the fossil share
};

// logarithmic mean; L(a, a) = a
const logMean = (a: number, b: number): number =>
  a === b ? a : (a - b) / (Math.log(a) - Math.log(b));

// additive LMDI split of one country's fossil change over each window:
// F = E * s, so dF = L(F1, F0) * ln(E1 / E0) + L(F1, F0) * ln(s1 / s0), exactly
export const getFossilDecomposition = (
  rows: EnergyRow[],
  country: string,
  windows: [number, number][],
): FossilDecomposition[] => {
  const byYear = d3.index(
    rows.filter((d) => d.country === country),
    (d) => d.year,
  );
  const result: FossilDecomposition[] = [];

  for (const [startYear, endYear] of windows) {
    const start = byYear.get(startYear);
    const end = byYear.get(endYear);
    if (!start || !end) continue;

    // total energy is the sum of the nine sources, not primary_energy
    const e0 = sumSources(start, ALL_SOURCES);
    const e1 = sumSources(end, ALL_SOURCES);
    const f0 = sumSources(start, FOSSIL);
    const f1 = sumSources(end, FOSSIL);
    if (e0 === null || e1 === null || f0 === null || f1 === null) continue;

    const weight = logMean(f1, f0);
    result.push({
      startYear,
      endYear,
      dFossil: f1 - f0,
      demandEffect: weight * Math.log(e1 / e0),
      mixEffect: weight * Math.log(f1 / e1 / (f0 / e0)),
    });
  }

  return result;
};
