import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getGraphColor(phenomena: string) {
  switch (phenomena.toLowerCase()) {
    case "barometric pressure":
      return "#0000FF"; // Blue
    case "relative humidity":
      return "#008000"; // Green
    case "hPa":
      return "#FF0000"; // Red
    case "co2":
      return "#FFA500"; // Orange
    case "soil moisture":
      return "#A52A2A"; // Brown
    case "ambient light":
      return "#FFFF00"; // Yellow
    case "ultraviolet a light":
      return "#800080"; // Purple
    case "humidity":
      return "#008080"; // Teal
    case "pm2.5":
      return "#808080"; // Gray
    case "pm10 concentration":
      return "#FFC0CB"; // Pink
    case "air temperature":
      return "#00FFFF"; // Cyan
    case "precipitation":
      return "#ADD8E6"; // Light Blue
    case "volatile organic compound (voc)":
      return "#FF00FF"; // Magenta
    case "voltage":
      return "#FFD700"; // Gold
    case "sound level":
      return "#00FF00"; // Lime
    case "water level":
      return "#000080"; // Navy
    case "water temperature":
      return "#4B0082"; // Indigo
    case "wind direction":
      return "#808000"; // Olive
    case "wind speed":
      return "#800000"; // Maroon
    default:
      return "#000000"; // Default color if phenomena is not found (Black)
  }
}
