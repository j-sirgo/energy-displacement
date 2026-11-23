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

export type FossilWhatIf = {
  startYear: number;
  endYear: number;
  startShare: number; // fossil share of total energy, 0-1
  endShare: number;
  actual: number; // TWh, actual change in fossil energy
  whatIf: number; // TWh, change if the fossil share had stayed at startShare
  avoided: number; // TWh, whatIf - actual; negative when the share rose
};

// what-if split of one country's fossil change over each window. With F = E * s,
//   dF = s0 * dE  +  E1 * ds      exactly, no residual
//        what-if     mix change
// so the change avoided by the falling share is whatIf - actual = -E1 * ds
export const getFossilWhatIf = (
  rows: EnergyRow[],
  country: string,
  windows: [number, number][],
): FossilWhatIf[] => {
  const byYear = d3.index(
    rows.filter((d) => d.country === country),
    (d) => d.year,
  );
  const result: FossilWhatIf[] = [];

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

    const s0 = f0 / e0;
    const s1 = f1 / e1;
    const whatIf = s0 * (e1 - e0);
    result.push({
      startYear,
      endYear,
      startShare: s0,
      endShare: s1,
      actual: f1 - f0,
      whatIf,
      avoided: whatIf - (f1 - f0),
    });
  }

  return result;
};

export type IndexedPoint = {
  year: number;
  total: number; // baseYear = 100
  fossil: number;
  lowCarbon: number;
};

// one country's total, fossil and low-carbon energy as indexes (baseYear = 100),
// for each year from fromYear on; years with a missing row or null source are skipped
export const getIndexedSeries = (
  rows: EnergyRow[],
  country: string,
  baseYear: number,
  fromYear: number,
): IndexedPoint[] => {
  const countryRows = rows.filter((d) => d.country === country);
  const base = countryRows.find((d) => d.year === baseYear);
  if (!base) return [];

  const baseTotal = sumSources(base, ALL_SOURCES);
  const baseFossil = sumSources(base, FOSSIL);
  const baseLow = sumSources(base, LOW_CARBON);
  if (baseTotal === null || baseFossil === null || baseLow === null) return [];

  const series: IndexedPoint[] = [];
  for (const row of countryRows) {
    if (row.year < fromYear) continue;
    const total = sumSources(row, ALL_SOURCES);
    const fossil = sumSources(row, FOSSIL);
    const lowCarbon = sumSources(row, LOW_CARBON);
    if (total === null || fossil === null || lowCarbon === null) continue;
    series.push({
      year: row.year,
      total: (100 * total) / baseTotal,
      fossil: (100 * fossil) / baseFossil,
      lowCarbon: (100 * lowCarbon) / baseLow,
    });
  }

  // rows are already in year order in data.ts, but don't rely on it
  return series.sort((a, b) => a.year - b.year);
};

export type CountryPoint = {
  year: number;
  fossil: number | null; // TWh; null where a source is missing
  lowCarbon: number | null;
};

export type CountrySeries = {
  country: string;
  points: CountryPoint[];
};

// fossil and low-carbon TWh per year for every country except World,
// largest total energy in the country's latest year first
export const getCountrySeries = (rows: EnergyRow[]): CountrySeries[] => {
  const byCountry = d3.group(
    rows.filter((d) => d.country !== "World"),
    (d) => d.country,
  );

  const series = Array.from(byCountry, ([country, countryRows]) => ({
    country,
    points: countryRows
      .map((row) => ({
        year: row.year,
        fossil: sumSources(row, FOSSIL),
        lowCarbon: sumSources(row, LOW_CARBON),
      }))
      .sort((a, b) => a.year - b.year),
  }));

  // sort key: total energy in the latest year with complete data
  const latestTotal = (s: CountrySeries) => {
    const complete = s.points.filter((p) => p.fossil !== null && p.lowCarbon !== null);
    const last = complete[complete.length - 1];
    return last ? (last.fossil ?? 0) + (last.lowCarbon ?? 0) : 0;
  };

  // drop countries with no complete year at all (Nigeria: only nuclear and biofuel are reported)
  return series
    .filter((s) => latestTotal(s) > 0)
    .sort((a, b) => latestTotal(b) - latestTotal(a));
};

// the decade the page focuses on; shaded or highlighted in every chart
export const FOCUS: [number, number] = [2014, 2024];

// how a country's energy use changed:
//   added     fossil use rose
//   replaced  fossil use fell, and low-carbon grew by at least as much (total energy did not fall)
//   usedLess  fossil use fell by more than low-carbon grew (total energy fell)
export type ChangeGroup = "added" | "replaced" | "usedLess";

export const getChangeGroup = (d: CountryChange): ChangeGroup => {
  if (d.dFossil >= 0) return "added";
  return d.dLowCarbon + d.dFossil >= 0 ? "replaced" : "usedLess";
};

export type EnergyTotals = {
  fossil: number; // TWh
  lowCarbon: number;
};

// one country's fossil and low-carbon TWh in one year; null if the row or a source is missing
export const getTotals = (rows: EnergyRow[], country: string, year: number): EnergyTotals | null => {
  const row = rows.find((d) => d.country === country && d.year === year);
  if (!row) return null;
  const fossil = sumSources(row, FOSSIL);
  const lowCarbon = sumSources(row, LOW_CARBON);
  return fossil === null || lowCarbon === null ? null : { fossil, lowCarbon };
};
