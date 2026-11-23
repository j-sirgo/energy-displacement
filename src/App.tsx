import { data } from "./data";
import { getCountryChanges } from "./derive";
import { ResponsiveReplacementScatter } from "./ResponsiveReplacementScatter";
import { COLOR_FOSSIL_FELL, COLOR_FOSSIL_ROSE } from "./ReplacementScatter";

const countryChanges = getCountryChanges(data, 2014, 2024);

function App() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <h1>Adding, not replacing</h1>

      <section>
        <h2 style={{ fontSize: 18, marginBottom: 4 }}>Where did low-carbon growth replace fossil fuels?</h2>
        <p style={{ marginTop: 0, color: "#57606a", fontSize: 14 }}>
          Change in energy use by country, 2014–2024.{" "}
          <strong style={{ color: COLOR_FOSSIL_ROSE }}>Adding: both grew</strong>, or{" "}
          <strong style={{ color: COLOR_FOSSIL_FELL }}>replacing: fossil fell</strong>. Below the
          dashed line, fossil fell by more than low-carbon grew.
        </p>
        <ResponsiveReplacementScatter data={countryChanges} />
      </section>
    </main>
  );
}

export default App;
