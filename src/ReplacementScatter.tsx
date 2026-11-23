import * as d3 from "d3";
import { getChangeGroup } from "./derive";
import type { CountryChange } from "./derive";
import { COLOR_FOSSIL_FELL, COLOR_FOSSIL_ROSE, COLOR_TEXT } from "./colors";

type ReplacementScatterProps = {
  width: number;
  height: number;
  data: CountryChange[];
};

const MARGIN = { top: 16, right: 28, bottom: 48, left: 64 };

// symlog: linear within about ±SYMLOG_CONSTANT TWh, logarithmic beyond,
// so China does not squash the other 26 countries into a corner
const SYMLOG_CONSTANT = 100;
const X_DOMAIN: [number, number] = [-300, 10000];
const Y_DOMAIN: [number, number] = [-1500, 15000];
const X_TICKS = [-100, 0, 100, 300, 1000, 3000, 10000];
const Y_TICKS = [-1000, -300, -100, 0, 100, 300, 1000, 3000, 10000];

const DOT_RADIUS = 5;
const LABEL_FONT_SIZE = 11;
const LABEL_CHAR_WIDTH = 6.2; // rough width of one character at LABEL_FONT_SIZE
const LABEL_HEIGHT = 12;

const formatTick = d3.format(",");

// white outline behind text, so gridlines and dots can't cut through it
const halo = { stroke: "white", strokeWidth: 3, paintOrder: "stroke" } as const;

type Box = { x0: number; y0: number; x1: number; y1: number };
const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

type PlacedLabel = { country: string; x: number; y: number; anchor: "start" | "end" | "middle" };

// greedy label placement: biggest changes first; each label tries right, left, above and
// below its dot, and is skipped if all four would cover a dot, another label or the edge.
// A narrower chart therefore shows fewer labels instead of overlapping ones.
const placeLabels = (
  points: { country: string; cx: number; cy: number; size: number }[],
  boundsWidth: number,
  boundsHeight: number,
): PlacedLabel[] => {
  const dotBox = (p: { cx: number; cy: number }): Box => ({
    x0: p.cx - DOT_RADIUS - 1,
    y0: p.cy - DOT_RADIUS - 1,
    x1: p.cx + DOT_RADIUS + 1,
    y1: p.cy + DOT_RADIUS + 1,
  });
  const taken: Box[] = [];
  const placed: PlacedLabel[] = [];

  for (const p of [...points].sort((a, b) => b.size - a.size)) {
    const w = p.country.length * LABEL_CHAR_WIDTH;
    const h = LABEL_HEIGHT;
    const gap = DOT_RADIUS + 3;
    const candidates: { anchor: PlacedLabel["anchor"]; x: number; y: number; box: Box }[] = [
      { anchor: "start", x: p.cx + gap, y: p.cy, box: { x0: p.cx + gap, y0: p.cy - h / 2, x1: p.cx + gap + w, y1: p.cy + h / 2 } },
      { anchor: "end", x: p.cx - gap, y: p.cy, box: { x0: p.cx - gap - w, y0: p.cy - h / 2, x1: p.cx - gap, y1: p.cy + h / 2 } },
      { anchor: "middle", x: p.cx, y: p.cy - gap - h / 2, box: { x0: p.cx - w / 2, y0: p.cy - gap - h, x1: p.cx + w / 2, y1: p.cy - gap } },
      { anchor: "middle", x: p.cx, y: p.cy + gap + h / 2, box: { x0: p.cx - w / 2, y0: p.cy + gap, x1: p.cx + w / 2, y1: p.cy + gap + h } },
    ];
    const fit = candidates.find(
      (c) =>
        c.box.x0 >= 0 &&
        c.box.x1 <= boundsWidth + MARGIN.right - 2 &&
        c.box.y0 >= 0 &&
        c.box.y1 <= boundsHeight &&
        !taken.some((t) => overlaps(c.box, t)) &&
        !points.some((q) => q !== p && overlaps(c.box, dotBox(q))),
    );
    if (fit) {
      taken.push(fit.box);
      placed.push({ country: p.country, x: fit.x, y: fit.y, anchor: fit.anchor });
    }
  }
  return placed;
};

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

  // y = -x (fossil change exactly cancels low-carbon change, so total energy is unchanged)
  // inside the plotted domains: x from max(xMin, -yMax) to min(xMax, -yMin)
  const lineStart = Math.max(X_DOMAIN[0], -Y_DOMAIN[1]);
  const lineEnd = Math.min(X_DOMAIN[1], -Y_DOMAIN[0]);

  // the line's label sits 55% of the way from the origin to its upper-left end, in the
  // empty quadrant, rotated to the line's on-screen angle (the axes have different pixels
  // per unit, so the angle comes from the scales, not from the slope of -1)
  const LABEL_POSITION = 0.55;
  const lineLabelX = xScale(0) + LABEL_POSITION * (xScale(lineStart) - xScale(0));
  const lineLabelY = yScale(0) + LABEL_POSITION * (yScale(-lineStart) - yScale(0));
  const lineLabelAngle =
    (Math.atan2(yScale(-lineStart) - yScale(0), xScale(lineStart) - xScale(0)) * 180) / Math.PI +
    180; // +180 so the text reads left to right, not upside down

  const points = data.map((d) => ({
    country: d.country,
    cx: xScale(d.dLowCarbon),
    cy: yScale(d.dFossil),
    size: Math.abs(d.dLowCarbon) + Math.abs(d.dFossil),
    group: getChangeGroup(d),
  }));
  const labels = placeLabels(points, boundsWidth, boundsHeight);

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

        {/* "total energy use unchanged" line */}
        <line
          x1={xScale(lineStart)}
          y1={yScale(-lineStart)}
          x2={xScale(lineEnd)}
          y2={yScale(-lineEnd)}
          stroke={COLOR_TEXT}
          strokeWidth={1.25}
          strokeDasharray="5 4"
        />

        {/* dots: orange = fossil rose; green = fossil fell, filled if low-carbon grew by at
            least as much, hollow if the country used less energy overall */}
        {points.map((p) => (
          <circle
            key={p.country}
            cx={p.cx}
            cy={p.cy}
            r={DOT_RADIUS}
            fill={p.group === "added" ? COLOR_FOSSIL_ROSE : p.group === "replaced" ? COLOR_FOSSIL_FELL : "white"}
            fillOpacity={p.group === "usedLess" ? 1 : 0.85}
            stroke={p.group === "usedLess" ? COLOR_FOSSIL_FELL : "white"}
            strokeWidth={p.group === "usedLess" ? 2 : 1}
          />
        ))}

        {/* country labels, drawn after the dots so nothing paints over them */}
        {labels.map((l) => (
          <text
            key={l.country}
            x={l.x}
            y={l.y}
            dy="0.32em"
            textAnchor={l.anchor}
            fontSize={LABEL_FONT_SIZE}
            fill={COLOR_TEXT}
            {...halo}
          >
            {l.country}
          </text>
        ))}

        <text
          transform={`translate(${lineLabelX},${lineLabelY}) rotate(${lineLabelAngle})`}
          dy={-5}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fill={COLOR_TEXT}
          {...halo}
        >
          total energy use unchanged
        </text>

        {/* axis titles */}
        <text x={boundsWidth / 2} y={boundsHeight + 40} textAnchor="middle" fontSize={12} fill={COLOR_TEXT}>
          Change in low-carbon energy, 2014–2024 (TWh) →
        </text>
        <text
          transform={`translate(${-48},${boundsHeight / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={12}
          fill={COLOR_TEXT}
        >
          Change in fossil energy (TWh) →
        </text>
      </g>
    </svg>
  );
};
