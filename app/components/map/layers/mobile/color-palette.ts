import chroma from "chroma-js";

export const LOW_COLOR = "#0740ba";
export const HIGH_COLOR = "#97a6c7";

export const createPalette = (
  min: number,
  max: number,
  minColor = LOW_COLOR,
  maxColor = HIGH_COLOR,
) => chroma.scale([minColor, maxColor]).domain([min, max]);

export function calculateColorRange(baseColor: string) {
  const lowColor = chroma(baseColor).darken(1.5).hex(); // Darken the base color for LOW
  const highColor = chroma(baseColor).brighten(1.5).hex(); // Brighten the base color for HIGH
  return { lowColor, highColor };
}
