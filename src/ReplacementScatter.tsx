import * as d3 from "d3";
import type { CountryChange } from "./derive";
import { COLOR_FOSSIL_FELL, COLOR_FOSSIL_ROSE } from "./colors";

type ReplacementScatterProps = {
  width: number;
  height: number;
  data: CountryChange[];
};

const MARGIN = { top: 16, right: 24, bottom: 48, left: 64 };

// symlog: linear within about ±SYMLOG_CONSTANT TWh, logarithmic beyond
const SYMLOG_CONSTANT = 100;
const X_DOMAIN: [number, number] = [-300, 8000];
const Y_DOMAIN: [number, number] = [-1500, 10000];
const X_TICKS = [-100, 0, 100, 300, 1000, 3000];
const Y_TICKS = [-1000, -300, -100, 0, 100, 300, 1000, 3000];

// countries named on the chart; the rest stay as unlabelled dots
const LABELLED = new Set([
  "China",
  "India",
  "Indonesia",
  "United States",
  "Japan",
  "Germany",
  "United Kingdom",
  "Brazil",
]);


const formatTick = d3.format(",");

export const ReplacementScatter = ({ width, height, data }: ReplacementScatterProps) => {
  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;
  if (boundsWidth <= 0 || boundsHeight <= 0) return null;

  const xScale = d3
    .scaleSymlog()
    .constant(SYMLOG_CONSTANT)
    .domain(X_DOMAIN)
    .range([0, boundsWidth]);
  const yScale = d3
    .scaleSymlog()
    .constant(SYMLOG_CONSTANT)
    .domain(Y_DOMAIN)
    .range([boundsHeight, 0]);

  // y = -x inside the plotted domains: x from max(xMin, -yMax) to min(xMax, -yMin)
  const lineStart = Math.max(X_DOMAIN[0], -Y_DOMAIN[1]);
  const lineEnd = Math.min(X_DOMAIN[1], -Y_DOMAIN[0]);

  // label sits 60% of the way from the origin to the line's upper-left end,
  // away from the dots clustered just right of zero
  const LABEL_POSITION = 0.6;
  const labelX = xScale(0) + LABEL_POSITION * (xScale(lineStart) - xScale(0));
  const labelY = yScale(0) + LABEL_POSITION * (yScale(-lineStart) - yScale(0));
  const labelAngle =
    (Math.atan2(yScale(-lineStart) - yScale(0), xScale(lineStart) - xScale(0)) * 180) / Math.PI +
    180; // +180 so the text reads left to right, not upside down

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* grid and tick labels */}
        {X_TICKS.map((t) => (
          <g key={`x${t}`} transform={`translate(${xScale(t)},0)`}>
            <line y1={0} y2={boundsHeight} stroke={t === 0 ? "#8c959f" : "#eaeef2"} />
            <text y={boundsHeight + 18} textAnchor="middle" fontSize={11} fill="#57606a">
              {formatTick(t)}
            </text>
          </g>
        ))}
        {Y_TICKS.map((t) => (
          <g key={`y${t}`} transform={`translate(0,${yScale(t)})`}>
            <line x1={0} x2={boundsWidth} stroke={t === 0 ? "#8c959f" : "#eaeef2"} />
            <text x={-8} dy="0.32em" textAnchor="end" fontSize={11} fill="#57606a">
              {formatTick(t)}
            </text>
          </g>
        ))}

        {/* full-replacement line y = -x */}
        <line
          x1={xScale(lineStart)}
          y1={yScale(-lineStart)}
          x2={xScale(lineEnd)}
          y2={yScale(-lineEnd)}
          stroke="#1f2328"
          strokeWidth={1.25}
          strokeDasharray="5 4"
        />

        {/* dots and labels */}
        {data.map((d) => {
          const cx = xScale(d.dLowCarbon);
          const cy = yScale(d.dFossil);
          const color = d.dFossil < 0 ? COLOR_FOSSIL_FELL : COLOR_FOSSIL_ROSE;
          return (
            <g key={d.country}>
              <circle cx={cx} cy={cy} r={5} fill={color} fillOpacity={0.8} stroke="white" />
              {LABELLED.has(d.country) && (
                <text x={cx + 8} y={cy} dy="0.32em" fontSize={11} fill="#1f2328">
                  {d.country}
                </text>
              )}
            </g>
          );
        })}

        {/* line label, drawn after the dots so nothing paints over it. It sits in the empty
            upper-left quadrant (low-carbon fell, fossil rose), rotated to the line's on-screen
            angle; the axes have different pixels per unit, so the angle comes from the scales,
            not from the slope of -1 */}
        <text
          transform={`translate(${labelX},${labelY}) rotate(${labelAngle})`}
          dy={-5}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill="#1f2328"
          // white halo: the stroke is painted first, then the fill on top,
          // so gridlines and dots behind the text can't cut through it
          stroke="white"
          strokeWidth={3}
          paintOrder="stroke"
        >
          full replacement
        </text>

        {/* axis titles */}
        <text x={boundsWidth / 2} y={boundsHeight + 40} textAnchor="middle" fontSize={12} fill="#1f2328">
          Change in low-carbon energy, 2014–2024 (TWh, symlog)
        </text>
        <text
          transform={`translate(${-48},${boundsHeight / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={12}
          fill="#1f2328"
        >
          Change in fossil energy (TWh, symlog)
        </text>
      </g>
    </svg>
  );
};
