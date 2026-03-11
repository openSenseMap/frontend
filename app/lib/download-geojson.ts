import { valid } from "geojson-validation";

export function downloadGeojSON(data: any) {
  //@ts-ignore
  const geojson = JSON.parse(JSON.stringify(data));
  if (valid(geojson)) {
    const geojsonString = JSON.stringify(geojson);
    const blob = new Blob([geojsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "geojson_data.json";
    link.click();

    URL.revokeObjectURL(url);
  }
}
