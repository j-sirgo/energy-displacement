import * as d3 from "d3";
import { FOCUS } from "./derive";
import type { IndexedPoint } from "./derive";
import { COLOR_FOSSIL_FELL, COLOR_FOSSIL_ROSE, COLOR_HIGHLIGHT, COLOR_NET } from "./colors";

type IndexedLinesProps = {
  width: number;
  height: number;
  data: IndexedPoint[];
};

// labels sit inside the plot at the end of each line, so no wide right margin is needed
const MARGIN = { top: 16, right: 10, bottom: 32, left: 40 };

type SeriesKey = "total" | "fossil" | "lowCarbon";
const SERIES: { key: SeriesKey; label: string; color: string }[] = [
  { key: "lowCarbon", label: "Low-carbon", color: COLOR_FOSSIL_FELL },
  { key: "total", label: "Total", color: COLOR_NET },
  { key: "fossil", label: "Fossil", color: COLOR_FOSSIL_ROSE },
];

type Box = { x0: number; y0: number; x1: number; y1: number };
const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
const LABEL_CHAR_WIDTH = 7; // rough width of one character at 12px bold
const LABEL_HEIGHT = 13;

// white outline behind text, so lines and gridlines can't cut through it
const halo = { stroke: "white", strokeWidth: 3, paintOrder: "stroke" } as const;
const CHAR_WIDTH = 6; // rough width of one character at 11px

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
  // always label the last year too, unless it would sit on top of the previous tick
  const lastTick = xTicks[xTicks.length - 1];
  if (lastTick !== lastYear && xScale(lastYear) - xScale(lastTick) >= 34) xTicks.push(lastYear);

  const last = data[data.length - 1];
  const dip = data.find((d) => d.year === 2020);
  const dipNote = boundsWidth < 360 ? "2020: pandemic dip" : "2020: fossil fell in the pandemic";
  const dipNoteX = Math.min(
    xScale(2020),
    boundsWidth + MARGIN.right - (dipNote.length * CHAR_WIDTH) / 2,
  );
  const dipNoteY = dip ? yScale(dip.fossil) + 18 : 0;

  // a series' pixel y at any x, by straight-line interpolation between yearly points
  const yAt = (key: SeriesKey, x: number) => {
    const year = xScale.invert(x);
    const i = Math.max(1, Math.min(data.length - 1, d3.bisector((d: IndexedPoint) => d.year).left(data, year)));
    const a = data[i - 1];
    const b = data[i];
    const f = (year - a.year) / (b.year - a.year);
    return yScale(a[key] + f * (b[key] - a[key]));
  };
  // does any of the three lines pass through the box? sampled every 2px across it
  const crossesALine = (box: Box) =>
    SERIES.some((s) =>
      d3.range(box.x0, box.x1, 2).some((x) => {
        const y = yAt(s.key, Math.max(0, Math.min(boundsWidth, x)));
        return y > box.y0 && y < box.y1;
      }),
    );

  // end labels: each tries spots above and below its own line, at growing distances, ending
  // at the right edge and then sliding left a step at a time. It takes the first spot that no
  // line passes through and that doesn't cover another label or the 2020 note. A label more
  // than a few px from its line gets a short leader line back to it, as in the scatter.
  const taken: Box[] = dip
    ? [{
        x0: dipNoteX - (dipNote.length * CHAR_WIDTH) / 2,
        y0: dipNoteY - 10,
        x1: dipNoteX + (dipNote.length * CHAR_WIDTH) / 2,
        y1: dipNoteY + 3,
      }]
    : [];
  const NEAR_GAP = 3;
  const endLabels = SERIES.map((s) => {
    const text = `${s.label} ${Math.round(last[s.key])}`;
    const w = text.length * LABEL_CHAR_WIDTH;
    for (const gap of [NEAR_GAP, 16, 30, 46, 64]) {
      for (const shift of [0, 12, 24, 36, 48, 64, 80]) {
        const x1 = boundsWidth - shift;
        const x0 = x1 - w;
        if (x0 < 0) break;
        // the line's highest and lowest points under the label's width
        const ys = d3.range(x0, x1, 2).map((x) => yAt(s.key, x));
        const top = d3.min(ys) ?? 0;
        const bottom = d3.max(ys) ?? 0;
        // the leader runs straight up or down from the line, near the label's right end
        const leaderX = x1 - 6;
        for (const [box, leaderEnd] of [
          [{ x0, x1, y0: top - gap - LABEL_HEIGHT, y1: top - gap }, top - gap] as const,
          [{ x0, x1, y0: bottom + gap, y1: bottom + gap + LABEL_HEIGHT }, bottom + gap] as const,
        ]) {
          if (box.y0 < 0 || box.y1 > boundsHeight) continue;
          if (crossesALine(box) || taken.some((o) => overlaps(box, o))) continue;
          const lineY = yAt(s.key, leaderX);
          // a leader may not cross one of the other lines on its way
          const leaderCrosses = SERIES.some((o) => {
            if (o.key === s.key) return false;
            const y = yAt(o.key, leaderX);
            return y > Math.min(lineY, leaderEnd) && y < Math.max(lineY, leaderEnd);
          });
          if (gap > NEAR_GAP && leaderCrosses) continue;
          taken.push(box);
          return {
            ...s,
            text,
            x: x1,
            y: box.y1 - 3,
            leader: gap > NEAR_GAP ? { x: leaderX, y1: lineY, y2: leaderEnd } : null,
          };
        }
      }
    }
    // fallback if nothing fits: just above the end of its own line
    return { ...s, text, x: boundsWidth, y: yScale(last[s.key]) - 6, leader: null };
  });

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* the focus decade, shaded as in the small multiples; drawn first, behind everything */}
        <rect
          x={xScale(FOCUS[0])}
          width={xScale(FOCUS[1]) - xScale(FOCUS[0])}
          y={0}
          height={boundsHeight}
          fill={COLOR_HIGHLIGHT}
          fillOpacity={0.6}
        />
        <text
          x={(xScale(FOCUS[0]) + xScale(FOCUS[1])) / 2}
          y={boundsHeight - 8}
          textAnchor="middle"
          fontSize={11}
          fill="#57606a"
        >
          {FOCUS[0]}–{FOCUS[1]}
        </text>

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
            // the last year is right-aligned so it does not run past the narrow right margin
            textAnchor={t === lastYear ? "end" : "middle"}
            fontSize={11}
            fill="#57606a"
          >
            {formatYear(t)}
          </text>
        ))}

        {/* 2020 marker: fossil and total fell with the pandemic; low-carbon kept rising.
            The note sits just under the dip, shortened on narrow charts, and shifted left
            if it would run past the right edge */}
        {dip && (
          <g>
            <line
              x1={xScale(2020)}
              x2={xScale(2020)}
              y1={0}
              y2={boundsHeight}
              stroke="#8c959f"
              strokeDasharray="2 3"
            />
            <text
              x={dipNoteX}
              y={dipNoteY}
              textAnchor="middle"
              fontSize={11}
              fill="#57606a"
              {...halo}
            >
              {dipNote}
            </text>
          </g>
        )}

        {/* one path per series; d3.line turns the points into an SVG path string */}
        {SERIES.map((s) => {
          const path = d3
            .line<IndexedPoint>()
            .x((d) => xScale(d.year))
            .y((d) => yScale(d[s.key]))(data);
          return (
            <g key={s.key}>
              <path d={path ?? undefined} fill="none" stroke={s.color} strokeWidth={2} />
            </g>
          );
        })}

        {/* leader lines for labels placed away from their line */}
        {endLabels.map(
          (l) =>
            l.leader && (
              <line
                key={`leader-${l.key}`}
                x1={l.leader.x}
                x2={l.leader.x}
                y1={l.leader.y1}
                y2={l.leader.y2}
                stroke={l.color}
                strokeWidth={1}
              />
            ),
        )}

        {/* end labels, drawn after all three lines so no line paints over them */}
        {endLabels.map((l) => (
          <text
            key={`label-${l.key}`}
            x={l.x}
            y={l.y}
            textAnchor="end"
            fontSize={12}
            fontWeight={600}
            fill={l.color}
            {...halo}
          >
            {l.text}
          </text>
        ))}
      </g>
    </svg>
  );
};
