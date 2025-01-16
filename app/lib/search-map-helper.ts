import  { type LngLatBounds, type LngLatLike, type MapRef } from "react-map-gl";

/**
 * The function that is called when the user clicks on a location without bbox property in the search results. It flies the map to the location and closes the search results.
 *
 * @param center the coordinate of the center of the location to fly to
 */
export const goToLocation = (map: MapRef | undefined, center: LngLatLike) => {
  map?.flyTo({
    center: center,
    animate: true,
    speed: 1.6,
    zoom: 20,
    essential: true,
  });
};

//function to zoom back out of map
export const zoomOut = (map: MapRef | undefined) => {
  map?.flyTo({
    center: [0, 0],
    animate: true,
    speed: 1.6,
    zoom: 1,
    essential: true,
  });
};

/**
 * The function that is called when the user clicks on a location with the bbox property in the search results. It flies the map to the location and closes the search results.
 *
 * @param bbox
 */
export const goToLocationBBox = (
  map: MapRef | undefined,
  bbox: LngLatBounds,
) => {
  map?.fitBounds(bbox, {
    animate: true,
    speed: 1.6,
  });
};

/**
 * The function that is called when the user clicks on a device in the search results. It flies the map to the device and closes the search results.
 *
 * @param lng longitude of the device
 * @param lat latitude of the device
 * @param id id of the device
 */
export const goToDevice = (
  map: MapRef | undefined,
  lng: number,
  lat: number,
  id: string,
) => {
  map?.flyTo({
    center: [lng, lat],
    animate: true,
    speed: 1.6,
    zoom: 15,
    essential: true,
  });
};

export const goTo = (map: MapRef | undefined, item: any) => {
  if (item.type === "device") {
    goToDevice(map, item.lng, item.lat, item.deviceId);
  } else if (item.type === "location") {
    if (item.bbox) {
      goToLocationBBox(map, item.bbox);
    } else {
      goToLocation(map, item.center);
    }
  }
};
