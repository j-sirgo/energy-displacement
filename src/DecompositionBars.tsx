import * as d3 from "d3";
import type { FossilWhatIf } from "./derive";
import { COLOR_FOSSIL_FELL, COLOR_FOSSIL_ROSE, COLOR_TEXT } from "./colors";

type DecompositionBarsProps = {
  width: number;
  height: number;
  data: FossilWhatIf[];
};

const MARGIN = { top: 20, right: 12, bottom: 46, left: 56 };
// phone-sized charts: no rotated axis title (the unit sits above the axis instead), so the
// left margin shrinks and the bars get the room
const COMPACT_WIDTH = 440;
const MARGIN_COMPACT = { top: 28, right: 8, bottom: 42, left: 30 };

// label tiers by bar width (px): numbers only on medium bars, numbers with words on wide
// ones, nothing on bars too narrow to hold a number
const MIN_NUMBER_BAR_WIDTH = 30;
const MIN_WORDS_BAR_WIDTH = 96;
const MIN_SHARE_BAR_WIDTH = 40; // room for "86%→81%" under the bar

// values in thousand TWh, so labels fit on a bar
const formatValue = (v: number) => d3.format("+.1f")(v / 1000);
const formatAmount = (v: number) => d3.format(".1f")(v / 1000);
const formatTick = (v: number) => d3.format(",")(v / 1000);
const formatShare = d3.format(".0%");

// "1965–74", or "65–74" on compact charts
const windowLabel = (d: FossilWhatIf) => `${d.startYear}–${String(d.endYear).slice(2)}`;
const shortWindowLabel = (d: FossilWhatIf) =>
  `${String(d.startYear).slice(2)}–${String(d.endYear).slice(2)}`;

// white outline behind text, so a label over a bar or gridline stays readable
const halo = { stroke: "white", strokeWidth: 3, paintOrder: "stroke" } as const;

export const DecompositionBars = ({ width, height, data }: DecompositionBarsProps) => {
  const compact = width < COMPACT_WIDTH;
  const margin = compact ? MARGIN_COMPACT : MARGIN;
  const boundsWidth = width - margin.left - margin.right;
  const boundsHeight = height - margin.top - margin.bottom;
  if (boundsWidth <= 0 || boundsHeight <= 0 || data.length === 0) return null;

  const xScale = d3
    .scaleBand<string>()
    .domain(data.map(windowLabel))
    .range([0, boundsWidth])
    .padding(compact ? 0.15 : 0.25);
  const barWidth = xScale.bandwidth();

  // 25% headroom above the tallest bar for the annotation
  const yMax = (d3.max(data, (d) => Math.max(d.whatIf, d.actual)) ?? 0) * 1.25;
  const yScale = d3.scaleLinear().domain([0, yMax]).nice().range([boundsHeight, 0]);

  const showNumbers = barWidth >= MIN_NUMBER_BAR_WIDTH;
  const showWords = barWidth >= MIN_WORDS_BAR_WIDTH;
  const showShares = barWidth >= MIN_SHARE_BAR_WIDTH;

  const latest = data[data.length - 1];
  const latestIsRecord = latest.avoided === d3.max(data, (d) => d.avoided);

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* y grid and tick labels */}
        {yScale.ticks(5).map((t) => (
          <g key={t} transform={`translate(0,${yScale(t)})`}>
            <line x1={0} x2={boundsWidth} stroke={t === 0 ? "#8c959f" : "#eaeef2"} />
            <text x={-8} dy="0.32em" textAnchor="end" fontSize={11} fill="#57606a">
              {formatTick(t)}
            </text>
          </g>
        ))}
        {compact ? (
          <text x={-margin.left} y={-14} fontSize={11} fill={COLOR_TEXT}>
            Fossil growth, thousand TWh
          </text>
        ) : (
          <text
            transform={`translate(${-40},${boundsHeight / 2}) rotate(-90)`}
            textAnchor="middle"
            fontSize={12}
            fill={COLOR_TEXT}
          >
            Growth in fossil energy (thousand TWh)
          </text>
        )}

        {/* row label for the percentages under the bars */}
        {showShares && !compact && (
          <text x={-8} y={boundsHeight + 33} textAnchor="end" fontSize={10} fill="#57606a">
            fossil slice
          </text>
        )}

        {data.map((d, i) => {
          const label = windowLabel(d);
          const x = xScale(label) ?? 0;
          const cx = x + barWidth / 2;
          const isLatest = i === data.length - 1;
          const yActual = yScale(d.actual);
          const yWhatIf = yScale(d.whatIf);
          const gapHeight = yActual - yWhatIf; // > 0 when the shrinking slice avoided some growth

          return (
            <g key={label}>
              {/* only the shapes of earlier decades are faded; their labels stay readable */}
              <g opacity={isLatest ? 1 : 0.45}>
                {/* actual growth: solid */}
                <rect x={x} width={barWidth} y={yActual} height={boundsHeight - yActual} fill={COLOR_FOSSIL_ROSE} />
                {/* the gap up to the what-if level: growth that was avoided */}
                {gapHeight > 0 && (
                  <rect x={x} width={barWidth} y={yWhatIf} height={gapHeight} fill={COLOR_FOSSIL_FELL} fillOpacity={0.25} />
                )}
                {/* what-if: dashed outline, drawn last so it shows even inside the solid bar */}
                <rect
                  x={x}
                  width={barWidth}
                  y={yWhatIf}
                  height={boundsHeight - yWhatIf}
                  fill="none"
                  stroke={COLOR_FOSSIL_ROSE}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
              </g>

              {showNumbers && (
                <>
                  {/* what-if value, above the outline (or above the actual bar, if taller) */}
                  <text
                    x={cx}
                    y={Math.min(yWhatIf, yActual) - 5}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#57606a"
                    {...halo}
                  >
                    {formatValue(d.whatIf)}
                    {showWords && " if same slice"}
                  </text>
                  {/* actual value, just inside the top of the solid bar */}
                  <text x={cx} y={yActual + 14} textAnchor="middle" fontSize={11} fontWeight={600} fill="white">
                    {formatValue(d.actual)}
                  </text>
                  {/* avoided amount, centred in the gap when it is tall enough to hold text */}
                  {gapHeight >= 14 && (
                    <text
                      x={cx}
                      y={yWhatIf + gapHeight / 2}
                      dy="0.32em"
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={600}
                      fill={COLOR_FOSSIL_FELL}
                    >
                      {formatAmount(d.avoided)}
                      {showWords && " avoided"}
                    </text>
                  )}
                </>
              )}

              {/* decade, and fossil fuels' slice of all energy at its start and end */}
              <text
                x={cx}
                y={boundsHeight + 18}
                textAnchor="middle"
                fontSize={11}
                fontWeight={isLatest ? 600 : 400}
                fill={isLatest ? COLOR_TEXT : "#57606a"}
              >
                {compact ? shortWindowLabel(d) : label}
              </text>
              {showShares && (
                <text x={cx} y={boundsHeight + 33} textAnchor="middle" fontSize={compact ? 9 : 10} fill="#57606a">
                  {formatShare(d.startShare)}→{formatShare(d.endShare)}
                </text>
              )}
            </g>
          );
        })}

        {/* note on the latest decade, right-aligned to the plot, in a short form on compact
            charts; <tspan> lines need their own x, or each would start where the previous one ended */}
        {latest.avoided > 0 && (
          <text y={0} textAnchor="end" fontSize={compact ? 11 : 12} fill={COLOR_TEXT} {...halo}>
            <tspan x={boundsWidth} dy="0.8em" fontWeight={600}>
              {compact
                ? `${shortWindowLabel(latest)}: ${formatAmount(latest.avoided)} thousand TWh avoided,`
                : `${windowLabel(latest)}: ${formatAmount(latest.avoided)} thousand TWh avoided${latestIsRecord ? ", the most of any decade," : ","}`}
            </tspan>
            <tspan x={boundsWidth} dy="1.3em">
              {compact
                ? `but fossil still grew by ${formatAmount(latest.actual)}`
                : `but fossil energy still grew by ${formatAmount(latest.actual)} thousand TWh`}
            </tspan>
          </text>
        )}
      </g>
    </svg>
  );
};
