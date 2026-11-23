import { useRef } from "react";
import { useDimensions } from "./use-dimensions";
import { IndexedLines } from "./IndexedLines";
import type { IndexedPoint } from "./derive";

type ResponsiveIndexedLinesProps = {
  data: IndexedPoint[];
};

export const ResponsiveIndexedLines = ({ data }: ResponsiveIndexedLinesProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { width, height } = useDimensions(chartRef);

  return (
    <div ref={chartRef} style={{ width: "100%", height: 400 }}>
      <IndexedLines width={width} height={height} data={data} />
    </div>
  );
};
