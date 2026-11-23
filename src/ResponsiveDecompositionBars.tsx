import { useRef } from "react";
import { useDimensions } from "./use-dimensions";
import { DecompositionBars } from "./DecompositionBars";
import type { FossilWhatIf } from "./derive";

type ResponsiveDecompositionBarsProps = {
  data: FossilWhatIf[];
};

export const ResponsiveDecompositionBars = ({ data }: ResponsiveDecompositionBarsProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { width, height } = useDimensions(chartRef);

  return (
    <div ref={chartRef} style={{ width: "100%", height: 400 }}>
      <DecompositionBars width={width} height={height} data={data} />
    </div>
  );
};
