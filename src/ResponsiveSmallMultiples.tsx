import { useRef } from "react";
import { useDimensions } from "./use-dimensions";
import { SmallMultiples, getColumnCount, PANEL_HEIGHT } from "./SmallMultiples";
import type { CountrySeries } from "./derive";

type ResponsiveSmallMultiplesProps = {
  data: CountrySeries[];
};

// unlike the other wrappers, the height is not fixed: it follows from the width,
// because a narrower screen means fewer columns and therefore more rows
export const ResponsiveSmallMultiples = ({ data }: ResponsiveSmallMultiplesProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { width } = useDimensions(chartRef);

  const rows = Math.ceil(data.length / getColumnCount(width));

  return (
    <div ref={chartRef} style={{ width: "100%", height: rows * PANEL_HEIGHT }}>
      <SmallMultiples width={width} data={data} />
    </div>
  );
};
