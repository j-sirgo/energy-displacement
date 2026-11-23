import { useRef } from "react";
import { useDimensions } from "./use-dimensions";
import { ReplacementScatter } from "./ReplacementScatter";
import type { CountryChange } from "./derive";

type ResponsiveReplacementScatterProps = {
  data: CountryChange[];
};

// measures its own div and hands width and height to the plain chart;
// the height must be explicit, or the div collapses to 0 and nothing renders
export const ResponsiveReplacementScatter = ({ data }: ResponsiveReplacementScatterProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { width, height } = useDimensions(chartRef);

  return (
    <div ref={chartRef} style={{ width: "100%", height: 460 }}>
      <ReplacementScatter width={width} height={height} data={data} />
    </div>
  );
};
