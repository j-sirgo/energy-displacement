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
import { ResponsiveDecompositionWaterfall } from "./ResponsiveDecompositionWaterfall";
import { COLOR_FOSSIL_FELL, COLOR_FOSSIL_ROSE, COLOR_NET } from "./colors";

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
          Are low-carbon sources replacing fossil fuels, or adding to them? Between 2014 and 2024
          the world added 11,755 TWh of low-carbon energy, and 13,196 TWh of fossil energy on top.
        </p>
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
            The world's change in fossil energy per decade, split exactly into{" "}
            <strong style={{ color: COLOR_FOSSIL_ROSE }}>demand growth</strong> (more energy used in
            total) and the <strong style={{ color: COLOR_FOSSIL_FELL }}>mix effect</strong> (a change
            in the fossil share), giving the{" "}
            <strong style={{ color: COLOR_NET }}>net change</strong>.
          </p>
          <ResponsiveDecompositionWaterfall data={worldDecomposition} />
        </section>

        <section className="card wide">
          <h2>Country by country</h2>
          <p className="subtitle">
            <strong style={{ color: COLOR_FOSSIL_ROSE }}>Fossil</strong> and{" "}
            <strong style={{ color: COLOR_FOSSIL_FELL }}>low-carbon</strong> energy, 1965–2024, TWh.
            Each panel has its own scale, shown at its top right. Ordered by total energy use.
          </p>
          <ResponsiveSmallMultiples data={countrySeries} />
        </section>
      </div>
    </main>
  );
}

export default App;
