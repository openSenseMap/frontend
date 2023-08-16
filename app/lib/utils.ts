import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getGraphColor(phenomena: string) {
  // This is a list of all phenomena that are currently supported by the sensors.wiki API (https://api.sensors.wiki/phenomena).
  // colorcodes need to be updated - thi is what ChatGPT suggested
  switch (phenomena.toLowerCase()) {
    case "barometric pressure":
    case "barometrischer druck":
      return "#0000FF"; // Blue
    case "relative humidity":
    case "relative luftfeuchte":
      return "#008000"; // Green
    case "co2":
      return "#FFA500"; // Orange
    case "soil moisture":
    case "bodenfeuchte":
      return "#A52A2A"; // Brown
    case "ambient light":
    case "umgebungslicht":
      return "#FFFF00"; // Yellow
    case "ultraviolet a light":
    case "ultraviolett a licht":
      return "#800080"; // Purple
    case "air temperature":
    case "temperatur":
      return "#00FFFF"; // Cyan
    case "pm2.5":
      return "#808080"; // Gray
    case "pm10 concentration":
    case "pm10-konzentration":
      return "#FFC0CB"; // Pink
    case "humidity":
    case "feuchtigkeit":
      return "#008080"; // Teal
    case "precipitation":
    case "niederschlag":
      return "#ADD8E6"; // Light Blue
    case "volatile organic compound (voc)":
    case "flüchtige organische verbindungen (fov)":
      return "#FF00FF"; // Magenta
    case "voltage":
    case "spannung":
      return "#FFD700"; // Gold
    case "sound level":
    case "lautstärke":
      return "#00FF00"; // Lime
    case "water level":
    case "wasserstand":
      return "#000080"; // Navy
    case "water temperature":
    case "wassertemperatur":
      return "#4B0082"; // Indigo
    case "wind direction":
    case "windrichtung":
      return "#808000"; // Olive
    case "wind speed":
    case "windgeschwindigkeit":
      return "#800000"; // Maroon
    default:
      return "#000000"; // Default color if phenomena is not found (Black)
  }
}
