import { data } from "./data";
import {
  getCountryChanges,
  getCountrySeries,
  getFossilDecomposition,
  getIndexedSeries,
} from "./derive";
import { ResponsiveSmallMultiples } from "./ResponsiveSmallMultiples";
import { ResponsiveIndexedLines } from "./ResponsiveIndexedLines";
import { ResponsiveReplacementScatter } from "./ResponsiveReplacementScatter";
import { ResponsiveDecompositionBars } from "./ResponsiveDecompositionBars";
import { COLOR_FOSSIL_FELL, COLOR_FOSSIL_ROSE, COLOR_HIGHLIGHT, COLOR_NET, COLOR_TEXT } from "./colors";

const countryChanges = getCountryChanges(data, 2014, 2024);

const DECADES: [number, number][] = [
  [1965, 1974],
  [1974, 1984],
  [1984, 1994],
  [1994, 2004],
  [2004, 2014],
  [2014, 2024],
];
const worldDecomposition = getFossilDecomposition(data, "World", DECADES);
const worldIndexed = getIndexedSeries(data, "World", 2000, 2000);
const countrySeries = getCountrySeries(data);

function App() {
  return (
    <main className="page">
      <header className="page-header">
        <h1>Adding, not replacing</h1>
        <p>
          Are low-carbon sources replacing fossil fuels, or adding to them? Over the last decade,
          mostly adding: the world built more clean energy than ever, and burned more fossil fuel
          too.
        </p>
        {/* key figures, 2014–2024; checked against derive.ts (see README) */}
        <ul className="figures">
          <li>
            <strong style={{ color: COLOR_FOSSIL_FELL }}>+11,755 TWh</strong>
            low-carbon energy added worldwide, 2014–2024
          </li>
          <li>
            <strong style={{ color: COLOR_FOSSIL_ROSE }}>+13,196 TWh</strong>
            fossil energy added on top
          </li>
          <li>
            <strong style={{ color: COLOR_FOSSIL_FELL }}>13 of 27</strong>
            large energy users cut their fossil use
          </li>
          <li>
            <strong style={{ color: COLOR_FOSSIL_ROSE }}>85%</strong>
            of the world's fossil growth came from China and India
          </li>
        </ul>
      </header>

      <div className="dashboard">
        <section className="card">
          <h2>Where did low-carbon growth replace fossil fuels?</h2>
          <p className="subtitle">
            Change in energy use by country, 2014–2024.{" "}
            <strong style={{ color: COLOR_FOSSIL_ROSE }}>Adding: both grew</strong>, or{" "}
            <strong style={{ color: COLOR_FOSSIL_FELL }}>replacing: fossil fell</strong>. Below the
            dashed line, fossil fell by more than low-carbon grew.
          </p>
          <ResponsiveReplacementScatter data={countryChanges} />
        </section>

        <section className="card">
          <h2>Low-carbon doubled, and fossil still grew by half</h2>
          <p className="subtitle">
            World energy use, indexed to 2000 = 100:{" "}
            <strong style={{ color: COLOR_FOSSIL_FELL }}>low-carbon</strong>,{" "}
            <strong style={{ color: COLOR_NET }}>total</strong> and{" "}
            <strong style={{ color: COLOR_FOSSIL_ROSE }}>fossil</strong>, 2000–2024. Each line is
            relative to its own 2000 level, so total sits between the other two: in 2000, fossil
            was 86% of the total.
          </p>
          <ResponsiveIndexedLines data={worldIndexed} />
        </section>

        <section className="card wide">
          <h2>Demand growth keeps outrunning the shift in mix</h2>
          <p className="subtitle">
            The world's change in fossil energy per decade, split exactly into two parts.{" "}
            <strong style={{ color: COLOR_FOSSIL_ROSE }}>Demand growth</strong> (more energy used in
            total) pushes fossil use up; the{" "}
            <strong style={{ color: COLOR_FOSSIL_FELL }}>mix effect</strong> (a falling fossil share)
            pushes it down, except in 1994–2004, when the share rose. The{" "}
            <strong style={{ color: COLOR_TEXT }}>● dot</strong> is the net change: up bar plus
            down bar.
          </p>
          <ResponsiveDecompositionBars data={worldDecomposition} />
        </section>

        <section className="card wide">
          <h2>Country by country</h2>
          <p className="subtitle">
            <strong style={{ color: COLOR_FOSSIL_ROSE }}>Fossil</strong> and{" "}
            <strong style={{ color: COLOR_FOSSIL_FELL }}>low-carbon</strong> energy, 1965–2024, TWh.
            Each panel has its own scale, shown at its top right. The{" "}
            <span style={{ background: COLOR_HIGHLIGHT, padding: "1px 4px", borderRadius: 3 }}>
              shaded years, 2014–2024
            </span>
            , are the decade in the scatter and the highlighted bar above: the country's name is{" "}
            <strong style={{ color: COLOR_FOSSIL_FELL }}>green</strong> if its fossil use fell over
            them, <strong style={{ color: COLOR_FOSSIL_ROSE }}>orange</strong> if it rose. Ordered by
            total energy use.
          </p>
          <ResponsiveSmallMultiples data={countrySeries} />
        </section>
      </div>

      <footer className="page-footer">
        <p>
          Data:{" "}
          <a href="https://github.com/owid/energy-data">Our World in Data, Energy dataset</a> (CC BY
          4.0), via the{" "}
          <a href="https://www.react-graph-gallery.com/react-d3-dataviz-course">D3 ❤️ React course</a>.
          Low-carbon is nuclear, hydro, solar, wind, biofuel and other renewables; fossil is coal,
          oil and gas; total is the sum of the nine. Nigeria is left out: it reports only nuclear
          and biofuel.
        </p>
      </footer>
    </main>
  );
}

export default App;
