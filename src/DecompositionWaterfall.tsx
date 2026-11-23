import * as d3 from "d3";
import type { FossilDecomposition } from "./derive";
import { COLOR_FOSSIL_FELL, COLOR_FOSSIL_ROSE, COLOR_NET } from "./colors";

type DecompositionWaterfallProps = {
  width: number;
  height: number;
  data: FossilDecomposition[];
};

const MARGIN = { top: 20, right: 16, bottom: 32, left: 64 };

// the three bars inside each window, left to right
const STEPS = ["demand", "mix", "net"] as const;

// below this bar width (px), value labels would overlap, so they are hidden
const MIN_LABEL_BAR_WIDTH = 28;

// labels and ticks in thousand TWh, so "+21.7" fits over a narrow bar
const formatValue = (v: number) => d3.format("+.1f")(v / 1000);
const formatTick = (v: number) => d3.format(",")(v / 1000);

// "1965–74"
const windowLabel = (d: FossilDecomposition) => `${d.startYear}–${String(d.endYear).slice(2)}`;

export const DecompositionWaterfall = ({ width, height, data }: DecompositionWaterfallProps) => {
  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;
  if (boundsWidth <= 0 || boundsHeight <= 0) return null;

  // outer band: one slot per window; inner band: three bars within a slot
  const xScale = d3
    .scaleBand<string>()
    .domain(data.map(windowLabel))
    .range([0, boundsWidth])
    .padding(0.2);
  const stepScale = d3
    .scaleBand<string>()
    .domain(STEPS)
    .range([0, xScale.bandwidth()])
    .padding(0.08);
  const barWidth = stepScale.bandwidth();

  // the highest point is the top of the demand bar (or of the mix bar, if mix is positive)
  const yMax = d3.max(data, (d) => Math.max(d.demandEffect, d.demandEffect + d.mixEffect)) ?? 0;
  const yMin = Math.min(0, d3.min(data, (d) => d.dFossil) ?? 0);
  const yScale = d3.scaleLinear().domain([yMin, yMax]).nice().range([boundsHeight, 0]);

  const showLabels = barWidth >= MIN_LABEL_BAR_WIDTH;

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* y grid and tick labels */}
        {yScale.ticks(5).map((t) => (
          <g key={t} transform={`translate(0,${yScale(t)})`}>
            <line x1={0} x2={boundsWidth} stroke={t === 0 ? "#8c959f" : "#eaeef2"} />
            <text x={-8} dy="0.32em" textAnchor="end" fontSize={11} fill="#57606a">
              {formatTick(t)}
            </text>
          </g>
        ))}
        <text
          transform={`translate(${-50},${boundsHeight / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={12}
          fill="#1f2328"
        >
          Change in fossil energy (thousand TWh)
        </text>

        {data.map((d) => {
          const label = windowLabel(d);
          const x0 = xScale(label) ?? 0;
          const xDemand = x0 + (stepScale("demand") ?? 0);
          const xMix = x0 + (stepScale("mix") ?? 0);
          const xNet = x0 + (stepScale("net") ?? 0);
          const afterDemand = d.demandEffect;
          const afterMix = d.demandEffect + d.mixEffect; // equals d.dFossil

          // a bar between two values, whichever is higher on screen
          const bar = (from: number, to: number) => ({
            y: Math.min(yScale(from), yScale(to)),
            height: Math.abs(yScale(from) - yScale(to)),
          });

          return (
            <g key={label}>
              {/* demand: from 0 up to the demand effect */}
              <rect x={xDemand} width={barWidth} {...bar(0, afterDemand)} fill={COLOR_FOSSIL_ROSE} />
              {/* mix: floats from the top of demand to the net level */}
              <rect x={xMix} width={barWidth} {...bar(afterDemand, afterMix)} fill={COLOR_FOSSIL_FELL} />
              {/* net: from 0 to the actual change */}
              <rect x={xNet} width={barWidth} {...bar(0, d.dFossil)} fill={COLOR_NET} />

              {/* connectors: thin lines carrying each running total to the next bar */}
              <line
                x1={xDemand + barWidth}
                x2={xMix}
                y1={yScale(afterDemand)}
                y2={yScale(afterDemand)}
                stroke="#8c959f"
              />
              <line
                x1={xMix + barWidth}
                x2={xNet}
                y1={yScale(afterMix)}
                y2={yScale(afterMix)}
                stroke="#8c959f"
              />

              {showLabels && (
                <>
                  <text x={xDemand + barWidth / 2} y={yScale(afterDemand) - 4} textAnchor="middle" fontSize={10} fill={COLOR_FOSSIL_ROSE}>
                    {formatValue(d.demandEffect)}
                  </text>
                  {/* mix label at the bar's far end: below it if negative, above if positive */}
                  <text
                    x={xMix + barWidth / 2}
                    y={d.mixEffect < 0 ? yScale(afterMix) + 12 : yScale(afterMix) - 4}
                    textAnchor="middle"
                    fontSize={10}
                    fill={COLOR_FOSSIL_FELL}
                  >
                    {formatValue(d.mixEffect)}
                  </text>
                  <text x={xNet + barWidth / 2} y={yScale(d.dFossil) - 4} textAnchor="middle" fontSize={10} fill={COLOR_NET}>
                    {formatValue(d.dFossil)}
                  </text>
                </>
              )}

              {/* window label under the slot */}
              <text
                x={x0 + xScale.bandwidth() / 2}
                y={boundsHeight + 20}
                textAnchor="middle"
                fontSize={11}
                fill="#57606a"
              >
                {label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};
