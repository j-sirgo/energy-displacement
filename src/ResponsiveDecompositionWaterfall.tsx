import { useRef } from "react";
import { useDimensions } from "./use-dimensions";
import { DecompositionWaterfall } from "./DecompositionWaterfall";
import type { FossilDecomposition } from "./derive";

type ResponsiveDecompositionWaterfallProps = {
  data: FossilDecomposition[];
};

export const ResponsiveDecompositionWaterfall = ({ data }: ResponsiveDecompositionWaterfallProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { width, height } = useDimensions(chartRef);

  return (
    <div ref={chartRef} style={{ width: "100%", height: 380 }}>
      <DecompositionWaterfall width={width} height={height} data={data} />
    </div>
  );
};
