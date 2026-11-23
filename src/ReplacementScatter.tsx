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

type PlacedLabel = {
  country: string;
  x: number;
  y: number;
  anchor: "start" | "end" | "middle";
  // leader line from the dot's edge to the label, when the label sits away from its dot
  leader: { x1: number; y1: number; x2: number; y2: number } | null;
};

// rings of distances (px) and directions tried around each dot, nearest first. The first
// ring is the four spots right next to the dot (no leader line); the rest try 12 directions
// at growing distances and get a leader line, like ggrepel in R
const NEAR_DIRECTIONS = [0, 180, 270, 90]; // right, left, above, below (SVG y points down)
const FAR_DIRECTIONS = d3.range(0, 360, 30);
const FAR_DISTANCES = [22, 34, 48, 64, 82];

// greedy label placement: biggest changes first, so the large countries get the best spots.
// A label that cannot fit anywhere within the outer ring is left out rather than overlapping.
const placeLabels = (
  points: { country: string; cx: number; cy: number; size: number }[],
  boundsWidth: number,
  boundsHeight: number,
  reserved: Box[], // areas no label may cover, such as the dashed line's own label
): PlacedLabel[] => {
  const dotBox = (q: { cx: number; cy: number }): Box => ({
    x0: q.cx - DOT_RADIUS - 1,
    y0: q.cy - DOT_RADIUS - 1,
    x1: q.cx + DOT_RADIUS + 1,
    y1: q.cy + DOT_RADIUS + 1,
  });
  const dotBoxes = points.map(dotBox);
  const taken: Box[] = [...reserved];
  const placed: PlacedLabel[] = [];

  // a label box at angle and distance from the dot; the anchor side follows the angle,
  // so a label to the right starts at the point and one to the left ends there
  const candidate = (cx: number, cy: number, w: number, angle: number, distance: number) => {
    const rad = (angle * Math.PI) / 180;
    const px = cx + distance * Math.cos(rad);
    const py = cy + distance * Math.sin(rad);
    const cos = Math.cos(rad);
    const anchor: PlacedLabel["anchor"] = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
    const x0 = anchor === "start" ? px : anchor === "end" ? px - w : px - w / 2;
    // labels straight above or below sit with their near edge at the point
    const sin = Math.sin(rad);
    const yMid = anchor === "middle" ? py + (sin < 0 ? -LABEL_HEIGHT / 2 : LABEL_HEIGHT / 2) : py;
    const box: Box = { x0, y0: yMid - LABEL_HEIGHT / 2, x1: x0 + w, y1: yMid + LABEL_HEIGHT / 2 };
    return { anchor, x: px, y: yMid, box };
  };

  const fits = (box: Box, own: number) =>
    box.x0 >= 0 &&
    box.x1 <= boundsWidth + MARGIN.right - 2 &&
    box.y0 >= 0 &&
    box.y1 <= boundsHeight &&
    !taken.some((other) => overlaps(box, other)) &&
    !dotBoxes.some((d, i) => i !== own && overlaps(box, d));

  const order = points.map((q, i) => ({ ...q, i })).sort((m, n) => n.size - m.size);
  for (const q of order) {
    const w = q.country.length * LABEL_CHAR_WIDTH;
    const gap = DOT_RADIUS + 3;

    let found: (ReturnType<typeof candidate> & { far: boolean }) | null = null;
    for (const angle of NEAR_DIRECTIONS) {
      const c = candidate(q.cx, q.cy, w, angle, gap);
      if (fits(c.box, q.i)) { found = { ...c, far: false }; break; }
    }
    for (const distance of FAR_DISTANCES) {
      if (found) break;
      for (const angle of FAR_DIRECTIONS) {
        const c = candidate(q.cx, q.cy, w, angle, distance);
        if (fits(c.box, q.i)) { found = { ...c, far: true }; break; }
      }
    }
    if (!found) continue;

    taken.push(found.box);
    let leader: PlacedLabel["leader"] = null;
    if (found.far) {
      // from the nearest point of the label box back to the edge of the dot
      const ex = Math.max(found.box.x0, Math.min(q.cx, found.box.x1));
      const ey = Math.max(found.box.y0, Math.min(q.cy, found.box.y1));
      const len = Math.hypot(ex - q.cx, ey - q.cy);
      leader = {
        x1: q.cx + ((ex - q.cx) / len) * (DOT_RADIUS + 1),
        y1: q.cy + ((ey - q.cy) / len) * (DOT_RADIUS + 1),
        x2: ex,
        y2: ey,
      };
    }
    placed.push({ country: q.country, x: found.x, y: found.y, anchor: found.anchor, leader });
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
  // the line's label, shortened on narrow charts (same 360px cut-off as the 2020 note in
  // the indexed lines), and its rotated bounding box, kept clear of country labels
  const lineLabel = boundsWidth < 360 ? "total unchanged" : "total energy use unchanged";
  const lineLabelLength = lineLabel.length * 6.6; // bold 11px text is about 6.6px per character
  const theta = (lineLabelAngle * Math.PI) / 180;
  const halfW = (lineLabelLength / 2) * Math.abs(Math.cos(theta)) + 8 * Math.abs(Math.sin(theta));
  const halfH = (lineLabelLength / 2) * Math.abs(Math.sin(theta)) + 8 * Math.abs(Math.cos(theta));
  const lineLabelBox: Box = {
    x0: lineLabelX - halfW,
    y0: lineLabelY - halfH,
    x1: lineLabelX + halfW,
    y1: lineLabelY + halfH,
  };
  const labels = placeLabels(points, boundsWidth, boundsHeight, [lineLabelBox]);

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

        {/* leader lines for labels placed away from their dot; drawn before the dots */}
        {labels.map(
          (l) =>
            l.leader && (
              <line key={`leader-${l.country}`} {...l.leader} stroke="#57606a" strokeWidth={1} />
            ),
        )}

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
          {lineLabel}
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
