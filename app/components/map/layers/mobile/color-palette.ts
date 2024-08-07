import chroma from "chroma-js";

export const LOW_COLOR = "#375F73";
export const HIGH_COLOR = "#B5F584";

export const createPalette = (
  min: number,
  max: number,
  minColor = LOW_COLOR,
  maxColor = HIGH_COLOR
) => chroma.scale([minColor, maxColor]).domain([min, max]);
