# Adding, not replacing

My Module 5 (Responsiveness) project for the [D3 ❤️ React course](https://www.react-graph-gallery.com/react-d3-dataviz-course):
a responsive dashboard asking whether low-carbon energy is replacing fossil fuels or adding to
them. `README.md` has the plan and the four widgets. Fuller notes (numbers to check the charts
against, the LMDI decomposition formula, data caveats, project checklist) live in the course repo:
`C:\Users\jsirg\code\d3-react-course\notes\module-05-responsiveness\06-project.md`. Read both at
session start.

## Working with me

- I'm learning D3 and React; statistics is my background. Explain *why* when introducing a new D3
  or React idea.
- Stay within what the course has covered: SVG, scales, axes, `useDimensions`, the wrapper
  pattern. No hover effects or tooltips yet (Module 6), no `useMemo` unless I ask.
- Guide me rather than writing the whole thing: I want to build the charts myself.

## Code conventions

- D3 only for the math (scales, shape generators, tick values). React JSX draws everything
  (`<svg>`, `<circle>`, `<path>`, `<text>`). Never `d3.select()`, `.append()`, `.attr()`,
  `.call(axis)`, or `useRef` plus `useEffect` to let D3 draw into a node.
- TypeScript (`.tsx`), typed props and data.
- Every chart is a `ResponsiveX` wrapper (`useRef<HTMLDivElement>(null)` plus `useDimensions` from
  `src/use-dimensions.ts`) around a plain `X` that takes `width` and `height` as props.
- Low-carbon = nuclear + hydro + solar + wind + biofuel + other_renewable; fossil = coal + oil +
  gas. Use the sum of the nine sources as total energy, not `primary_energy`.
- `npm run dev` to run, `npm run deploy` to publish to GitHub Pages (base `/energy-displacement/`).
  Never commit `node_modules/` or `dist/`.

## Git

- Multi-line commit messages go in a file, committed with `git commit -F <file>`; `-m` only for
  single-line messages.
- Ask before pushing or deploying.

## Writing style (README, notes, chart text)

- En dashes (–) for numeric and year ranges only (2014–2024). Avoid em dashes in prose.
- No `×` as a dimension separator in prose ("country and year", not "country × year").
