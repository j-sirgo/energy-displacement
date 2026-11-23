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
