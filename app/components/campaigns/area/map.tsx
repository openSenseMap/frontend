import { TrashIcon } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { MapLayerMouseEvent, PopupProps } from "react-map-gl";
import { MapProvider, Source, Layer, Popup } from "react-map-gl";
import { Map } from "~/components/Map";
import DrawControl from "~/components/Map/draw-control";
import GeocoderControl from "~/components/Map/geocoder-control";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
} from "~/components/ui/popover";
import type { LinksFunction } from "@remix-run/server-runtime";
import maplibregl from "maplibre-gl/dist/maplibre-gl.css";
import geocode from "@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css";
import draw from "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import normalize from "@mapbox/geojson-normalize";
import flatten from "geojson-flatten";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: maplibregl,
    },
    {
      rel: "stylesheet",
      href: draw,
    },
    {
      rel: "stylesheet",
      href: geocode,
    },
  ];
};

type MapProps = {
  mapRef: any;
  // handleMapClick: (e: MapLayerMouseEvent) => void
  drawPopoverOpen: boolean;
  setDrawPopoverOpen: Dispatch<SetStateAction<boolean>>;
  // onUpdate: (e: any) => void
  // onDelete: (e: any) => void
  geojsonUploadData: FeatureCollection<Geometry, GeoJsonProperties> | null;
  setGeojsonUploadData: Dispatch<
    SetStateAction<FeatureCollection<Geometry, GeoJsonProperties> | null>
  >;
  // popup: PopupProps | false
  // setPopup: Dispatch<SetStateAction<false | PopupProps | undefined>>
  setFeatures: (features: any) => void;
};

export default function DefineAreaMap({
  setFeatures,
  drawPopoverOpen,
  setDrawPopoverOpen,
  mapRef,
  geojsonUploadData,
  setGeojsonUploadData,
}: MapProps) {
  const { t } = useTranslation("campaign-area");
  const [popup, setPopup] = useState<PopupProps | false>();

  const onUpdate = useCallback(
    (e: any) => {
      setGeojsonUploadData(null);
      // if (e.features[0].properties.radius) {
      //   const coordinates = [
      //     e.features[0].geometry.coordinates[0],
      //     e.features[0].geometry.coordinates[1],
      //   ]; //[lon, lat]
      //   const radius = parseInt(e.features[0].properties.radius); // in meters
      //   const options = { numberOfEdges: 32 }; //optional, defaults to { numberOfEdges: 32 }

      //   const polygon = circleToPolygon(coordinates, radius, options);
      //   const updatedFeatures = {
      //     type: "Feature",
      //     geometry: {
      //       type: "Polygon",
      //       coordinates: polygon.coordinates[0].map((c) => {
      //         return [c[0], c[1]];
      //       }),
      //     },
      //     properties: {
      //       radius: radius,
      //       centerpoint: e.features[0].geometry.coordinates,
      //     },
      //   };
      //   console.log(updatedFeatures);
      //   setFeatures(updatedFeatures);
      // } else {
      setFeatures((currFeatures: any) => {
        const updatedFeatures = e.features.map((f: any) => {
          return { ...f };
        });
        const normalizedFeatures = normalize(updatedFeatures[0]);
        const flattenedFeatures = flatten(normalizedFeatures);
        return flattenedFeatures;
      });
    },
    // },
    [setFeatures, setGeojsonUploadData]
  );

  const onDelete = useCallback(
    (e: any) => {
      setFeatures((currFeatures: any) => {
        const newFeatures = { ...currFeatures };
        for (const f of e.features) {
          delete newFeatures[f.id];
        }
        return newFeatures;
      });
    },
    [setFeatures]
  );

  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (geojsonUploadData != null) {
        const { lngLat } = e;
        setPopup({
          latitude: lngLat.lat,
          longitude: lngLat.lng,
          className: "p-4",
          children: (
            <div className="my-2">
              {geojsonUploadData.features.map((f: any, index: number) => (
                <div key={index}>
                  {Object.entries(f.properties).map(([key, value]) => (
                    <div key={key}>
                      <strong>{key}:</strong> {value as string}
                    </div>
                  ))}
                </div>
              ))}
              <Button
                onClick={() => {
                  setGeojsonUploadData(null);
                  setFeatures({});
                  setPopup(false);
                }}
                variant={"outline"}
                size={"sm"}
                className="float-right"
              >
                <TrashIcon className="h-4 w-4 text-red-500" /> Delete
              </Button>
            </div>
          ),
        });
      }
    },
    [geojsonUploadData, setFeatures, setGeojsonUploadData]
  );

  return (
    <MapProvider>
      <Map
        ref={(ref) => (mapRef.current = ref && ref.getMap())}
        initialViewState={{ latitude: 7, longitude: 52, zoom: 2 }}
        style={{
          width: "70%",
          height: "100%",
          position: "fixed",
          top: 0,
          right: 0,
        }}
        // onLoad={onLoad}
        onClick={handleMapClick}
      >
        <GeocoderControl
          language="de"
          onResult={(e) => console.log(e)}
          position="top-left"
        />
        <Popover
          open={drawPopoverOpen}
          onOpenChange={setDrawPopoverOpen}
          defaultOpen
        >
          <PopoverAnchor className="absolute left-10 top-[200px]" />
          <DrawControl
            position="top-left"
            // defaultMode="drag_circle"
            displayControlsDefault={false}
            controls={{ polygon: true, point: true, trash: true }}
            // modes={{
            //   ...modes,
            //   // radius_mode: RadiusMode,
            //   draw_circle: CircleMode,
            //   drag_circle: DragCircleMode,
            // }}
            onCreate={onUpdate}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
          <PopoverContent side="right">
            {t("use these symbols to draw different geometries on the map")}
            <PopoverArrow />
          </PopoverContent>
        </Popover>
        {geojsonUploadData && (
          <Source type="geojson" data={geojsonUploadData}>
            <Layer
              type="fill"
              paint={{
                "fill-color": "#555555",
                "fill-opacity": 0.5,
              }}
            />
          </Source>
        )}
        {popup && (
          <Popup {...popup} anchor="bottom" onClose={() => setPopup(false)} />
        )}
      </Map>
    </MapProvider>
  );
}
