import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getGraphColor(phenomena: string) {
  switch (phenomena) {
    case "Barometric pressure":
      return "#0000FF"; // Blue
    case "Relative humidity":
      return "#008000"; // Green
    case "Temperature":
      return "#FF0000"; // Red
    case "CO2":
      return "#FFA500"; // Orange
    case "Soil moisture":
      return "#A52A2A"; // Brown
    case "Ambient Light":
      return "#FFFF00"; // Yellow
    case "Ultraviolet A light":
      return "#800080"; // Purple
    case "Humidity":
      return "#008080"; // Teal
    case "PM2.5":
      return "#808080"; // Gray
    case "PM10 concentration":
      return "#FFC0CB"; // Pink
    case "Air temperature":
      return "#00FFFF"; // Cyan
    case "Precipitation":
      return "#ADD8E6"; // Light Blue
    case "Volatile organic compound (VOC)":
      return "#FF00FF"; // Magenta
    case "Voltage":
      return "#FFD700"; // Gold
    case "Sound level":
      return "#00FF00"; // Lime
    case "Water level":
      return "#000080"; // Navy
    case "Water temperature":
      return "#4B0082"; // Indigo
    case "Wind direction":
      return "#808000"; // Olive
    case "Wind speed":
      return "#800000"; // Maroon
    default:
      return "#000000"; // Default color if phenomena is not found (Black)
  }
}
