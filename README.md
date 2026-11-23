# Adding, not replacing

A responsive React + D3 dashboard on the world's energy mix, 1965–2024. It's the Responsiveness
module project from the [D3 ❤️ React course](https://www.react-graph-gallery.com/react-d3-dataviz-course).

The angle: **is low-carbon energy replacing fossil fuels, or being added on top of them?** Between
2014 and 2024 the world's low-carbon energy grew 56% (+11,755 TWh) and its fossil energy 10%
(+13,196 TWh): a smaller percentage, but a bigger amount, because fossil fuels are still about
four-fifths of all energy. Fossil use fell in 13 of the 27 countries with usable data, but only 5
of them added more low-carbon energy than the fossil energy they cut; the other 8 mostly used less
energy overall. China and India account for 85% of the world's fossil growth.

## The widgets

Each is a `ResponsiveX` wrapper, measured with `useDimensions`, around a plain chart that takes
`width` and `height`. On screens 880px and wider the two world charts sit side by side; below
that, everything stacks in one column. The page reads as a story in four steps, with key figures
above and a "What this means" box below. The focus decade, 2014–2024, is shaded or highlighted in
every chart.

1. **Indexed lines (what happened):** the world's total, fossil and low-carbon energy, 2000–2024,
   with each line's 2000 level set to 100.
2. **Decomposition bars (why):** the world's actual growth in fossil energy per decade (solid bar)
   against the growth if fossil fuels had kept their start-of-decade share of all energy (dashed
   outline). The gap is what the shrinking share avoided. The split is exact:
   ΔF = s₀·ΔE + E₁·Δs, with E the total energy and s the fossil share.
3. **Replacement scatter (who):** one dot per country, change in low-carbon (x) against change in
   fossil (y), TWh, 2014–2024, on symlog axes. The dashed line y = −x marks unchanged total energy
   use. Countries fall into three groups: added (fossil rose), replaced (fossil fell and low-carbon
   grew by at least as much) and used less (fossil fell by more than low-carbon grew). Labels are
   placed automatically and dropped where they would overlap; every country is also listed under
   its group below the chart.
4. **Small multiples (every country):** fossil and low-carbon TWh, 1965–2024, for the 27 countries
   with usable data, each panel on its own scale, with the number of columns computed from the
   measured width.

Nigeria is in the dataset but reports only nuclear and biofuel, so it is left out of every widget.

## Files

| File | What it holds |
|---|---|
| `src/data.ts` | the 1,704-row dataset and its types |
| `src/derive.ts` | the derived series: per-country changes and their groups, the what-if decomposition, the indexed series, the per-country series |
| `src/colors.ts` | the colours shared by the charts and the subtitles |
| `src/use-dimensions.ts` | the course's `useDimensions` hook, typed for React 19 |
| `src/ReplacementScatter.tsx`, `src/IndexedLines.tsx`, `src/DecompositionBars.tsx`, `src/SmallMultiples.tsx` | the four plain charts |
| `src/Responsive*.tsx` | their responsive wrappers |
| `src/App.tsx`, `src/index.css` | the page: text, key figures, takeaways and the grid layout |

## Data

[Our World in Data, Energy dataset](https://github.com/owid/energy-data) (CC BY 4.0), as packaged
by the course. Low-carbon means nuclear, hydro, solar, wind, biofuel and other renewables; fossil
means coal, oil and gas; total energy is the sum of the nine sources, not `primary_energy`.

## Run

```sh
npm install
npm run dev
```

## Deploy

`npm run deploy` builds and publishes `dist/` to the `gh-pages` branch (GitHub Pages, base path
`/energy-displacement/`).
