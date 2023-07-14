//inspired by geojson.io
import bbox from "@turf/bbox";

export default function zoomToExtent(map: any, feature: any) {
  // if the data is a single point, flyTo()
  if (feature.geometry.length === 1 && feature.geometry.type === "Point") {
    map.flyTo({
      center: feature.geometry.coordinates,
      zoom: 6,
      duration: 1000,
    });
  } else {
    const bounds = bbox(feature);
    map.fitBounds(bounds, {
      padding: 50,
      duration: 1000,
    });
  }
}
