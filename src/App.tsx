import * as d3 from "d3";
import { data } from "./data";
import {
  FOCUS,
  getChangeGroup,
  getCountryChanges,
  getCountrySeries,
  getFossilWhatIf,
  getIndexedSeries,
  getTotals,
} from "./derive";
import type { ChangeGroup } from "./derive";
import { ResponsiveSmallMultiples } from "./ResponsiveSmallMultiples";
import { ResponsiveIndexedLines } from "./ResponsiveIndexedLines";
import { ResponsiveReplacementScatter } from "./ResponsiveReplacementScatter";
import { ResponsiveDecompositionBars } from "./ResponsiveDecompositionBars";
import { COLOR_FOSSIL_FELL, COLOR_FOSSIL_ROSE, COLOR_HIGHLIGHT, COLOR_NET } from "./colors";

const [START, END] = FOCUS;
const DECADES: [number, number][] = [
  [1965, 1974],
  [1974, 1984],
  [1984, 1994],
  [1994, 2004],
  [2004, 2014],
  [2014, 2024],
];

// --- derived series, one per chart ---
const countryChanges = getCountryChanges(data, START, END);
const worldWhatIf = getFossilWhatIf(data, "World", DECADES);
const worldIndexed = getIndexedSeries(data, "World", 2000, 2000);
const countrySeries = getCountrySeries(data);

// --- numbers quoted in the text, computed so they can't drift from the charts ---
const worldStart = getTotals(data, "World", START);
const worldEnd = getTotals(data, "World", END);
if (!worldStart || !worldEnd) throw new Error("World totals missing for the focus decade");

const dLowCarbon = worldEnd.lowCarbon - worldStart.lowCarbon;
const dFossil = worldEnd.fossil - worldStart.fossil;
const pctLowCarbon = dLowCarbon / worldStart.lowCarbon;
const pctFossil = dFossil / worldStart.fossil;
const fossilShareEnd = worldEnd.fossil / (worldEnd.fossil + worldEnd.lowCarbon);
const fossilShare2000 = (() => {
  const w = getTotals(data, "World", 2000);
  return w ? w.fossil / (w.fossil + w.lowCarbon) : NaN;
})();

// countries by group, biggest change first
const groupOf = (group: ChangeGroup) =>
  countryChanges
    .filter((d) => getChangeGroup(d) === group)
    .sort((a, b) => Math.abs(b.dFossil) - Math.abs(a.dFossil))
    .map((d) => d.country);
const added = groupOf("added");
const replaced = groupOf("replaced");
const usedLess = groupOf("usedLess");
const nCountries = countryChanges.length;
const nFossilFell = replaced.length + usedLess.length;

const fossilChangeOf = (country: string) =>
  countryChanges.find((d) => d.country === country)?.dFossil ?? 0;
const chinaIndiaShare = (fossilChangeOf("China") + fossilChangeOf("India")) / dFossil;

const formatTwh = d3.format("+,.0f");
const formatPct = d3.format("+.0%");
const formatShare = d3.format(".0%");

const orange = { color: COLOR_FOSSIL_ROSE };
const green = { color: COLOR_FOSSIL_FELL };
const shaded = { background: COLOR_HIGHLIGHT, padding: "1px 4px", borderRadius: 3 };

function App() {
  return (
    <main className="page">
      <header className="page-header">
        <h1>Adding, not replacing</h1>
        <p className="lead">
          Is low-carbon energy replacing fossil fuels, or just being added on top of them? From{" "}
          {START} to {END}, mostly added on top. Low-carbon energy grew much faster, but fossil
          fuels still supply about four-fifths of the world's energy, so their small percentage
          gain was the bigger amount.
        </p>
        <p className="definitions">
          <strong>Low-carbon energy</strong> is nuclear, hydro, solar, wind, biofuel and other
          renewables. <strong>Fossil fuels</strong> are coal, oil and gas. Energy is measured in
          terawatt-hours (TWh): one TWh is a billion kilowatt-hours, the unit on a home
          electricity bill. This page focuses on <span style={shaded}>{START}–{END}</span>; the
          earlier years are there for background.
        </p>

        <ul className="figures">
          <li>
            <strong style={green}>{formatPct(pctLowCarbon)}</strong>
            low-carbon energy, world, {START}–{END} ({formatTwh(dLowCarbon)} TWh)
          </li>
          <li>
            <strong style={orange}>{formatPct(pctFossil)}</strong>
            fossil energy: a smaller percentage, but a bigger amount ({formatTwh(dFossil)} TWh)
          </li>
          <li>
            <strong style={green}>
              {nFossilFell} of {nCountries}
            </strong>
            big energy users cut their fossil use, but only {replaced.length} added more low-carbon
            energy than the fossil energy they cut
          </li>
          <li>
            <strong style={orange}>{formatShare(chinaIndiaShare)}</strong>
            of the world's fossil growth came from China and India
          </li>
        </ul>
      </header>

      <div className="dashboard">
        <section className="card">
          <p className="step">1. What happened in the world</p>
          <h2>Since 2000, low-carbon energy has doubled, and fossil energy still grew by half</h2>
          <p className="subtitle">
            World energy use, with each line's 2000 level set to 100, so 200 means double.{" "}
            <strong style={green}>Low-carbon</strong> pulled away after 2014, but{" "}
            <strong style={orange}>fossil</strong> kept climbing.{" "}
            <strong style={{ color: COLOR_NET }}>Total</strong> energy stays close to fossil because
            fossil fuels were {formatShare(fossilShare2000)} of it in 2000.
          </p>
          <ResponsiveIndexedLines data={worldIndexed} />
        </section>

        <section className="card">
          <p className="step">2. Why fossil energy kept growing</p>
          <h2>Fossil fuels lost ground to low-carbon energy, but the world's appetite grew faster</h2>
          <p className="subtitle">
            Each <strong style={orange}>solid bar</strong> is how much the world's fossil energy
            use grew in that decade. The dashed outline is how much it would have grown if fossil
            fuels had kept the same slice of all energy.{" "}
            <strong style={green}>The gap</strong> is the growth avoided because their slice
            shrank. The two percentages under each bar are that slice at the start and at the end
            of the decade: 86%→81% means fossil fuels went from 86% of all energy to 81%. In
            1994–2004 the slice grew slightly, so there is no gap.
          </p>
          <ResponsiveDecompositionBars data={worldWhatIf} />
        </section>

        <section className="card wide">
          <p className="step">3. Who added and who replaced</p>
          <h2>
            Fossil use fell in {nFossilFell} of {nCountries} countries, but only {replaced.length}{" "}
            replaced it with low-carbon energy
          </h2>
          <p className="subtitle">
            Each dot is a country, {START}–{END}. Further right means it added more low-carbon
            energy; higher means it burned more fossil fuel. In {added.length} countries{" "}
            <strong style={orange}>fossil use grew</strong>. In {replaced.length},{" "}
            <strong style={green}>fossil use fell and low-carbon grew by more</strong>. In{" "}
            {usedLess.length}, fossil use fell mostly because the country{" "}
            <span className="hollow">used less energy overall</span>: those are below the dashed
            line, which marks no change in total energy use. The axes are stretched near zero so
            the smaller countries don't pile up: read the numbers on the axes, not the distances.
          </p>
          <ResponsiveReplacementScatter data={countryChanges} />
        </section>

        <section className="card wide">
          <p className="step">4. Every country's story</p>
          <h2>Country by country, since 1965</h2>
          <p className="subtitle">
            <strong style={orange}>Fossil</strong> and <strong style={green}>low-carbon</strong>{" "}
            energy use, 1965–{END}. Each panel has its own scale (its top value is at the top
            right), so compare the shapes, not the heights. The{" "}
            <span style={shaded}>shaded years</span> are {START}–{END}: each country's name is
            coloured by whether its <strong style={green}>fossil use fell</strong> or{" "}
            <strong style={orange}>fossil use rose</strong> over them. Biggest energy users first.
          </p>
          <ResponsiveSmallMultiples data={countrySeries} />
        </section>

        <section className="card wide takeaways">
          <h2>What this means</h2>
          <ol>
            <li>
              <strong>The world is adding, not replacing.</strong> From {START} to {END}, low-carbon
              energy grew by {d3.format(",.0f")(dLowCarbon)} TWh, and fossil energy grew by{" "}
              {d3.format(",.0f")(dFossil)} TWh on top of it.
            </li>
            <li>
              <strong>Low-carbon is growing faster, from a much smaller base.</strong> It grew{" "}
              {d3.format(".0%")(pctLowCarbon)} against fossil's{" "}
              {d3.format(".0%")(pctFossil)}, but fossil fuels are still{" "}
              {formatShare(fossilShareEnd)} of the world's energy, so their small gain was the
              larger one.
            </li>
            <li>
              <strong>
                Fossil use falls only when low-carbon energy grows faster than total energy use.
              </strong>{" "}
              That happened in {nFossilFell} of the {nCountries} biggest energy users: in{" "}
              {replaced.length} because low-carbon energy grew strongly, and in {usedLess.length}{" "}
              mostly because they used less energy overall. In the other {added.length}, led by
              China and India, fossil use kept growing.
            </li>
          </ol>
        </section>
      </div>

      <footer className="page-footer">
        <p>
          Data:{" "}
          <a href="https://github.com/owid/energy-data">Our World in Data, Energy dataset</a> (CC BY
          4.0), via the{" "}
          <a href="https://www.react-graph-gallery.com/react-d3-dataviz-course">D3 ❤️ React course</a>.
          The countries are the world's 28 largest energy users. Total energy is the sum of the
          nine sources listed above. Nigeria is left out because it reports only nuclear and
          biofuel. Russia's data starts in 1985; before that it was part of the Soviet Union.
        </p>
      </footer>
    </main>
  );
}

export default App;
