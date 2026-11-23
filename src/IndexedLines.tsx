import * as d3 from "d3";
import type { IndexedPoint } from "./derive";
import { COLOR_FOSSIL_FELL, COLOR_FOSSIL_ROSE, COLOR_NET } from "./colors";

type IndexedLinesProps = {
  width: number;
  height: number;
  data: IndexedPoint[];
};

// wide right margin: each line is labelled at its end instead of with a legend
const MARGIN = { top: 16, right: 110, bottom: 32, left: 48 };

type SeriesKey = "total" | "fossil" | "lowCarbon";
const SERIES: { key: SeriesKey; label: string; color: string }[] = [
  { key: "lowCarbon", label: "Low-carbon", color: COLOR_FOSSIL_FELL },
  { key: "total", label: "Total", color: COLOR_NET },
  { key: "fossil", label: "Fossil", color: COLOR_FOSSIL_ROSE },
];

const formatYear = d3.format("d"); // 2000, not 2,000

export const IndexedLines = ({ width, height, data }: IndexedLinesProps) => {
  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;
  if (boundsWidth <= 0 || boundsHeight <= 0 || data.length === 0) return null;

  const [firstYear, lastYear] = d3.extent(data, (d) => d.year) as [number, number];
  const xScale = d3.scaleLinear().domain([firstYear, lastYear]).range([0, boundsWidth]);

  const allValues = data.flatMap((d) => SERIES.map((s) => d[s.key]));
  const yScale = d3
    .scaleLinear()
    .domain([Math.min(90, d3.min(allValues) ?? 90), d3.max(allValues) ?? 100])
    .nice()
    .range([boundsHeight, 0]);

  // about one year tick per 70px, so a phone gets fewer labels than a desktop
  const xTicks = xScale.ticks(Math.max(2, Math.floor(boundsWidth / 70)));

  const last = data[data.length - 1];

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* y grid; the base-year line at 100 is darker */}
        {yScale.ticks(5).map((t) => (
          <g key={t} transform={`translate(0,${yScale(t)})`}>
            <line x1={0} x2={boundsWidth} stroke={t === 100 ? "#8c959f" : "#eaeef2"} />
            <text x={-8} dy="0.32em" textAnchor="end" fontSize={11} fill="#57606a">
              {t}
            </text>
          </g>
        ))}

        {/* x tick labels */}
        {xTicks.map((t) => (
          <text
            key={t}
            x={xScale(t)}
            y={boundsHeight + 20}
            textAnchor="middle"
            fontSize={11}
            fill="#57606a"
          >
            {formatYear(t)}
          </text>
        ))}

        {/* one path per series; d3.line turns the points into an SVG path string */}
        {SERIES.map((s) => {
          const path = d3
            .line<IndexedPoint>()
            .x((d) => xScale(d.year))
            .y((d) => yScale(d[s.key]))(data);
          return (
            <g key={s.key}>
              <path d={path ?? undefined} fill="none" stroke={s.color} strokeWidth={2} />
              <text
                x={boundsWidth + 6}
                y={yScale(last[s.key])}
                dy="0.32em"
                fontSize={12}
                fontWeight={600}
                fill={s.color}
              >
                {s.label} {Math.round(last[s.key])}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};
