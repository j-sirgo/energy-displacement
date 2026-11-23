import * as d3 from "d3";
import type { CountryPoint, CountrySeries } from "./derive";
import { COLOR_FOSSIL_FELL, COLOR_FOSSIL_ROSE, COLOR_HIGHLIGHT } from "./colors";

type SmallMultiplesProps = {
  width: number;
  data: CountrySeries[];
};

// the grid is computed from the width: about one column per 220px
export const PANEL_MIN_WIDTH = 220;
export const PANEL_HEIGHT = 130;
const PANEL_MARGIN = { top: 22, right: 8, bottom: 18, left: 8 };
const GAP = 12; // horizontal space between panels

// the scatter's window, shaded in every panel
const HIGHLIGHT: [number, number] = [2014, 2024];

export const getColumnCount = (width: number) => Math.max(1, Math.floor(width / PANEL_MIN_WIDTH));

const formatMax = d3.format(",.2~s"); // 38907 -> "39k"
const formatYear = d3.format("d");

type PanelProps = {
  series: CountrySeries;
  width: number;
  xDomain: [number, number];
};

const Panel = ({ series, width, xDomain }: PanelProps) => {
  const boundsWidth = width - PANEL_MARGIN.left - PANEL_MARGIN.right;
  const boundsHeight = PANEL_HEIGHT - PANEL_MARGIN.top - PANEL_MARGIN.bottom;

  // shared x across panels; free y per panel, so each country's own mix is readable
  const xScale = d3.scaleLinear().domain(xDomain).range([0, boundsWidth]);
  const yMax = d3.max(series.points, (p) => Math.max(p.fossil ?? 0, p.lowCarbon ?? 0)) ?? 0;
  const yScale = d3.scaleLinear().domain([0, yMax]).nice(2).range([boundsHeight, 0]);
  const yTop = yScale.domain()[1];

  // .defined() breaks the line at null values instead of drawing them as zero
  const lineFor = (key: "fossil" | "lowCarbon") =>
    d3
      .line<CountryPoint>()
      .defined((p) => p[key] !== null)
      .x((p) => xScale(p.year))
      .y((p) => yScale(p[key] ?? 0))(series.points) ?? undefined;

  // name colour: green if fossil fell over the highlight window, orange if it rose
  const fossilAt = (year: number) => series.points.find((p) => p.year === year)?.fossil ?? null;
  const fossilStart = fossilAt(HIGHLIGHT[0]);
  const fossilEnd = fossilAt(HIGHLIGHT[1]);
  const nameColor =
    fossilStart === null || fossilEnd === null
      ? "#1f2328"
      : fossilEnd < fossilStart
        ? COLOR_FOSSIL_FELL
        : COLOR_FOSSIL_ROSE;

  return (
    <g transform={`translate(${PANEL_MARGIN.left},${PANEL_MARGIN.top})`}>
      {/* shaded highlight window, drawn first so the lines sit on top */}
      <rect
        x={xScale(HIGHLIGHT[0])}
        width={xScale(HIGHLIGHT[1]) - xScale(HIGHLIGHT[0])}
        y={0}
        height={boundsHeight}
        fill={COLOR_HIGHLIGHT}
      />
      <text y={-8} fontSize={12} fontWeight={600} fill={nameColor}>
        {series.country}
      </text>

      {/* top gridline labelled with this panel's own maximum */}
      <line x1={0} x2={boundsWidth} y1={0} y2={0} stroke="#eaeef2" />
      <text x={boundsWidth} y={-8} textAnchor="end" fontSize={10} fill="#57606a">
        {formatMax(yTop)} TWh
      </text>
      <line x1={0} x2={boundsWidth} y1={boundsHeight} y2={boundsHeight} stroke="#8c959f" />

      <path d={lineFor("fossil")} fill="none" stroke={COLOR_FOSSIL_ROSE} strokeWidth={1.75} />
      <path d={lineFor("lowCarbon")} fill="none" stroke={COLOR_FOSSIL_FELL} strokeWidth={1.75} />

      {/* first and last year only; the x range is the same in every panel */}
      <text y={boundsHeight + 13} fontSize={10} fill="#57606a">
        {formatYear(xDomain[0])}
      </text>
      <text x={boundsWidth} y={boundsHeight + 13} textAnchor="end" fontSize={10} fill="#57606a">
        {formatYear(xDomain[1])}
      </text>
    </g>
  );
};

export const SmallMultiples = ({ width, data }: SmallMultiplesProps) => {
  if (width <= 0 || data.length === 0) return null;

  const columns = getColumnCount(width);
  const rows = Math.ceil(data.length / columns);
  const panelWidth = (width - GAP * (columns - 1)) / columns;
  const height = rows * PANEL_HEIGHT;

  const xDomain = d3.extent(data.flatMap((s) => s.points), (p) => p.year) as [number, number];

  return (
    <svg width={width} height={height}>
      {data.map((series, i) => {
        // fill the grid row by row
        const col = i % columns;
        const row = Math.floor(i / columns);
        return (
          <g key={series.country} transform={`translate(${col * (panelWidth + GAP)},${row * PANEL_HEIGHT})`}>
            <Panel series={series} width={panelWidth} xDomain={xDomain} />
          </g>
        );
      })}
    </svg>
  );
};
