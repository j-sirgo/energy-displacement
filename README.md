# Adding, not replacing

A responsive React + D3 dashboard on the world's energy mix, 1965–2024. It's the Responsiveness
module project from the [D3 ❤️ React course](https://www.react-graph-gallery.com/react-d3-dataviz-course).

The angle: **are low-carbon sources replacing fossil fuels, or adding to them?** Between 2014 and
2024 the world added 11,755 TWh of low-carbon energy, and 13,196 TWh of fossil energy on top.
Fossil use fell in 13 of the 27 countries with usable data, while China and India alone added
about 11,000 TWh.

## The widgets

Each is a `ResponsiveX` wrapper, measured with `useDimensions`, around a plain chart that takes
`width` and `height`. On screens 880px and wider they sit on a two-column grid; below that, they
stack in one column.

1. **Replacement scatter:** one dot per country, change in low-carbon (x) against change in fossil
   (y), TWh, 2014–2024, on symlog axes, with the full-replacement line y = −x.
2. **Indexed lines (2000 = 100):** the world's total, fossil and low-carbon energy, 2000–2024.
3. **Decomposition bars:** the world's change in fossil energy per decade, split into a
   demand-growth effect (bar up) and a mix effect (bar down), with the net change as a dot (LMDI,
   exactly additive); 2014–2024 is highlighted.
4. **Small multiples:** fossil and low-carbon TWh, 1965–2024, for the 27 countries with usable
   data, with the number of columns computed from the measured width.

Nigeria is in the dataset but reports only nuclear and biofuel, so it is left out of every widget.

## Files

| File | What it holds |
|---|---|
| `src/data.ts` | the 1,704-row dataset and its types |
| `src/derive.ts` | the derived series: per-country changes, the LMDI decomposition, the indexed series, the per-country series |
| `src/colors.ts` | the colours shared by the charts and the subtitles |
| `src/use-dimensions.ts` | the course's `useDimensions` hook, typed for React 19 |
| `src/ReplacementScatter.tsx`, `src/IndexedLines.tsx`, `src/DecompositionBars.tsx`, `src/SmallMultiples.tsx` | the four plain charts |
| `src/Responsive*.tsx` | their responsive wrappers |
| `src/App.tsx`, `src/index.css` | the page, its grid layout and the key figures |

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
