import * as d3 from "d3";
import type { FossilDecomposition } from "./derive";
import { COLOR_FOSSIL_FELL, COLOR_FOSSIL_ROSE, COLOR_TEXT } from "./colors";

type DecompositionBarsProps = {
  width: number;
  height: number;
  data: FossilDecomposition[];
};

const MARGIN = { top: 20, right: 16, bottom: 32, left: 64 };

// below this bar width (px), value labels would overlap, so they are hidden
const MIN_LABEL_BAR_WIDTH = 40;

// labels and ticks in thousand TWh, so "+21.7" fits beside a bar
const formatValue = (v: number) => d3.format("+.1f")(v / 1000);
const formatTick = (v: number) => d3.format(",")(v / 1000);

// "1965–74"
const windowLabel = (d: FossilDecomposition) => `${d.startYear}–${String(d.endYear).slice(2)}`;

// white outline behind text, so a label over a bar or gridline stays readable
const halo = { stroke: "white", strokeWidth: 3, paintOrder: "stroke" } as const;

export const DecompositionBars = ({ width, height, data }: DecompositionBarsProps) => {
  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;
  if (boundsWidth <= 0 || boundsHeight <= 0) return null;

  const xScale = d3
    .scaleBand<string>()
    .domain(data.map(windowLabel))
    .range([0, boundsWidth])
    .padding(0.35);
  const barWidth = xScale.bandwidth();

  // a negative mix effect pushes down from 0; a positive one (1994–2004) stacks on top of demand
  const top = (d: FossilDecomposition) => d.demandEffect + Math.max(0, d.mixEffect);
  const bottom = (d: FossilDecomposition) => Math.min(0, d.mixEffect, d.dFossil);

  // 15% headroom above the tallest bar for the annotation
  const yMax = (d3.max(data, top) ?? 0) * 1.15;
  const yMin = d3.min(data, bottom) ?? 0;
  const yScale = d3.scaleLinear().domain([yMin, yMax]).nice().range([boundsHeight, 0]);

  // a bar between two values, whichever is higher on screen
  const bar = (from: number, to: number) => ({
    y: Math.min(yScale(from), yScale(to)),
    height: Math.abs(yScale(from) - yScale(to)),
  });

  const showLabels = barWidth >= MIN_LABEL_BAR_WIDTH;
  const latest = data[data.length - 1];
  const annotationX = latest ? (xScale(windowLabel(latest)) ?? 0) + barWidth : 0;

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* y grid and tick labels; zero is darker, since bars push away from it */}
        {yScale.ticks(5).map((t) => (
          <g key={t} transform={`translate(0,${yScale(t)})`}>
            <line x1={0} x2={boundsWidth} stroke={t === 0 ? "#57606a" : "#eaeef2"} />
            <text x={-8} dy="0.32em" textAnchor="end" fontSize={11} fill="#57606a">
              {formatTick(t)}
            </text>
          </g>
        ))}
        <text
          transform={`translate(${-50},${boundsHeight / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={12}
          fill={COLOR_TEXT}
        >
          Change in fossil energy (thousand TWh)
        </text>

        {data.map((d, i) => {
          const label = windowLabel(d);
          const x = xScale(label) ?? 0;
          const cx = x + barWidth / 2;
          const isLatest = i === data.length - 1;
          const mixUp = d.mixEffect > 0;
          // a positive mix bar starts where demand ends; a negative one starts at 0
          const mixFrom = mixUp ? d.demandEffect : 0;

          return (
            // earlier decades are faded so the latest one stands out
            <g key={label} opacity={isLatest ? 1 : 0.45}>
              <rect x={x} width={barWidth} {...bar(0, d.demandEffect)} fill={COLOR_FOSSIL_ROSE} />
              <rect x={x} width={barWidth} {...bar(mixFrom, mixFrom + d.mixEffect)} fill={COLOR_FOSSIL_FELL} />

              {/* the net change: where fossil use actually landed */}
              <circle cx={cx} cy={yScale(d.dFossil)} r={5} fill={COLOR_TEXT} stroke="white" strokeWidth={1.5} />

              {showLabels && (
                <>
                  {/* demand: above its bar, or inside it when a positive mix bar sits on top */}
                  <text
                    x={cx}
                    y={mixUp ? yScale(d.demandEffect) + 12 : yScale(d.demandEffect) - 5}
                    textAnchor="middle"
                    fontSize={10}
                    fill={COLOR_FOSSIL_ROSE}
                    {...halo}
                  >
                    {formatValue(d.demandEffect)}
                  </text>
                  {/* mix: beyond the far end of its bar */}
                  <text
                    x={cx}
                    y={mixUp ? yScale(mixFrom + d.mixEffect) - 5 : yScale(d.mixEffect) + 12}
                    textAnchor="middle"
                    fontSize={10}
                    fill={COLOR_FOSSIL_FELL}
                    {...halo}
                  >
                    {formatValue(d.mixEffect)}
                  </text>
                  {/* net: to the right of its dot */}
                  <text
                    x={cx + 9}
                    y={yScale(d.dFossil)}
                    dy="0.32em"
                    fontSize={11}
                    fontWeight={600}
                    fill={COLOR_TEXT}
                    {...halo}
                  >
                    {formatValue(d.dFossil)}
                  </text>
                </>
              )}

              <text x={cx} y={boundsHeight + 20} textAnchor="middle" fontSize={11} fill="#57606a">
                {label}
              </text>
            </g>
          );
        })}

        {/* annotation over the latest decade, right-aligned to its bar */}
        {latest && latest.mixEffect < 0 && (
          // <tspan> lines need their own x, or each would start where the previous one ended
          <text y={0} textAnchor="end" fontSize={11} fill={COLOR_TEXT}>
            <tspan x={annotationX} dy="0.8em" fontWeight={600}>
              {windowLabel(latest)}: the biggest mix shift yet,
            </tspan>
            <tspan x={annotationX} dy="1.3em">
              but demand growth was {d3.format(".1f")(latest.demandEffect / -latest.mixEffect)} times
              as large
            </tspan>
          </text>
        )}
      </g>
    </svg>
  );
};
