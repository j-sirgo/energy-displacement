# Adding, not replacing

A responsive React + D3 dashboard on the world's energy mix, 1965–2024. It's the Responsiveness
module project from the [D3 ❤️ React course](https://www.react-graph-gallery.com/react-d3-dataviz-course).

The angle: **are low-carbon sources replacing fossil fuels, or adding to them?** Between 2014 and
2024 the world added 11,755 TWh of low-carbon energy, and 13,196 TWh of fossil energy on top.
Fossil use fell in 13 of the 28 countries, while China and India alone added about 11,000 TWh.

Planned widgets (each a `ResponsiveX` wrapper around a plain chart, measured with `useDimensions`):

1. **Replacement scatter:** one dot per country, change in low-carbon (x) against change in fossil
   (y), TWh, 2014–2024, with the full-replacement line y = −x.
2. **Decomposition waterfall:** the world's change in fossil energy per decade, split into a
   demand-growth effect and a mix effect (LMDI, exactly additive).
3. **Indexed lines (2000 = 100):** total, fossil and low-carbon energy.
4. **Small multiples:** fossil and low-carbon TWh for the 28 countries, with the number of columns
   computed from the measured width.

| File | What it holds |
|---|---|
| `src/data.ts` | the 1,704-row dataset and its types |
| `src/use-dimensions.ts` | the course's `useDimensions` hook, typed for React 19 |
| `src/App.tsx` | the page |

Data: [Our World in Data, Energy dataset](https://github.com/owid/energy-data) (CC BY 4.0), as
packaged by the course. Low-carbon means nuclear, hydro, solar, wind, biofuel and other renewables.

## Run

```sh
npm install
npm run dev
```

## Deploy

`npm run deploy` builds and publishes `dist/` to the `gh-pages` branch (GitHub Pages, base path
`/energy-displacement/`).
