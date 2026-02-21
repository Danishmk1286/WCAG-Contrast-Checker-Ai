import React, { useMemo } from "react";
import tinycolor from "tinycolor2";
import colorBlind from "color-blind";

interface VisionSimulationProps {
  textColor: string;
  backgroundColor: string;
}

const VisionSimulation: React.FC<VisionSimulationProps> = ({
  textColor,
  backgroundColor,
}) => {
  // Define the simulation functions
  const simulations = useMemo(
    () => ({
      normal: (c: string) => c,
      protanopia: colorBlind.protanopia,
      deuteranopia: colorBlind.deuteranopia,
      tritanopia: colorBlind.tritanopia,
      achromatopsia: colorBlind.achromatopsia,
    }),
    []
  );

  // Compute simulated views
  const simulatedViews = useMemo(() => {
    return Object.entries(simulations).map(([key, fn]) => {
      const simBg = fn(backgroundColor);
      const simText = fn(textColor);
      // Ensure text remains readable in simulation
      const textCol = tinycolor(simText).isLight() ? "hsl(var(--foreground))" : "hsl(var(--background))";
      return { key, bg: simBg, text: textCol };
    });
  }, [backgroundColor, textColor, simulations]);

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold mb-2 text-foreground">
        Visual Impairment Simulation
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {simulatedViews.map(({ key, bg, text }) => (
          <div
            key={key}
            className="rounded-lg border p-3 flex flex-col items-center text-center"
            style={{
              backgroundColor: bg,
              color: text,
            }}
          >
            <div className="text-xs font-bold capitalize mb-1">{key}</div>
            <p className="text-sm">Sample Text</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisionSimulation;
