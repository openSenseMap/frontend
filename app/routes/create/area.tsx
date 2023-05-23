import Map from "~/components/Map";
import maplibregl from "maplibre-gl/dist/maplibre-gl.css";
import DrawControl from "~/components/Map/DrawControl";
import { Layer, MapRef, Source } from "react-map-gl";
import { MapProvider } from "react-map-gl";
import { useCallback, useContext, useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "~/components/ui/button";
import { FeatureContext } from "../create";
import GeocoderControl from "~/components/Map/GeocoderControl";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { Link } from "@remix-run/react";
import geocode from "@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css";
import draw from "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import type { LinksFunction } from "@remix-run/server-runtime";
import RadiusMode from "~/components/Map/RadiusMode";
import MapboxDraw, { modes } from "@mapbox/mapbox-gl-draw";
import circleToPolygon from "circle-to-polygon";
// import CustomControl from "~/components/Map/CustomControl";
// import RadiusMode from "~/components/Map/RadiusMode";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { valid } from "geojson-validation";
import {
  CircleMode,
  DragCircleMode,
  DirectMode,
  SimpleSelectMode,
} from "maplibre-gl-draw-circle";

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

export default function Explore() {
  const [geojsonUploadData, setGeojsonUploadData] = useState(null);
  const { features, setFeatures } = useContext(FeatureContext);
  const mapRef: any = useRef();
  // const draw = new MapboxDraw({

  //   modes: {
  //     ...modes,
  //     draw_circle: CircleMode,
  //     // draw_rectangle:
  //   },
  // });
  // const onLoad = () => mapRef.current?.addControl(draw);

  const handleFileUpload = (event: any) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e?.target?.result;
      if (content && typeof content === "string") {
        const geojson = JSON.parse(content);
        if (valid(geojson)) {
          setGeojsonUploadData(geojson);
          if (geojson.type === "FeatureCollection") {
            setFeatures(geojson.features);
          } else if (geojson.type === "Feature") {
            setFeatures([geojson]);
          }
        } else {
          console.error("Invalid GeoJSON file");
          // Display an error message to the user or handle the error appropriately
        }
      }
    };
    reader.readAsText(file);
  };

  const onUpdate = useCallback((e: any) => {
    if (e.features[0].properties.radius) {
      const coordinates = [
        e.features[0].geometry.coordinates[0],
        e.features[0].geometry.coordinates[1],
      ]; //[lon, lat]
      const radius = parseInt(e.features[0].properties.radius); // in meters
      const options = { numberOfEdges: 32 }; //optional, defaults to { numberOfEdges: 32 }

      const polygon = circleToPolygon(coordinates, radius, options);
      const updatedFeatures = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: polygon.coordinates[0].map((c) => {
            return [c[0], c[1]];
          }),
        },
        properties: {
          radius: radius,
          centerpoint: e.features[0].geometry.coordinates,
        },
      };
      console.log(updatedFeatures);
      setFeatures(updatedFeatures);
    } else {
      setFeatures((currFeatures: any) => {
        const updatedFeatures = e.features.map((f: any) => {
          return { ...f };
        });
        console.log(updatedFeatures);
        return updatedFeatures;
      });
    }
  }, []);

  const onDelete = useCallback((e: any) => {
    setFeatures((currFeatures: any) => {
      const newFeatures = { ...currFeatures };
      for (const f of e.features) {
        delete newFeatures[f.id];
      }
      return newFeatures;
    });
  }, []);

  return (
    <div className="flex h-full w-full">
      <div className="flex flex-col gap-3">
        <h1 className="text-lg font-bold">
          Schritt 1: Interessensgebiet definieren
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Option 1: </CardTitle>
            <CardDescription>Gebiet auf der Karte zeichnen</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Zeichnen</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Option 2: </CardTitle>
            <CardDescription>GeoJSON importieren</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Importieren</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>GeoJSON Datei hochladen</DialogTitle>
                  <DialogDescription>
                    Hier können Sie eine valide <b>.geojson</b> Datei hochladen
                  </DialogDescription>
                </DialogHeader>
                <input
                  type="file"
                  accept=".geojson"
                  onChange={handleFileUpload}
                />
                <DialogFooter>
                  <DialogClose>
                    <Button>Auswählen</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
      <div className="fixed inset-y-0 right-0 z-0 h-full w-2/3">
        <Link to={"/create/form"}>
          <Button
            className="absolute top-4 right-4 z-50 ml-auto"
            disabled={Object.keys(features).length === 0}
          >
            Weiter
          </Button>
        </Link>
        <MapProvider>
          <Map
            ref={(ref) => (mapRef.current = ref && ref.getMap())}
            initialViewState={{ latitude: 7, longitude: 52, zoom: 2 }}
            // onLoad={onLoad}
          >
            <GeocoderControl
              language="de"
              onResult={(e) => console.log(e)}
              position="top-left"
            />
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
            {/* <CustomControl /> */}
            {/* <Button className="absolute top-1/2 left-4 z-50">Weiter</Button> */}
            {geojsonUploadData && (
              <Source type="geojson" data={geojsonUploadData}>
                <Layer
                  type="fill"
                  paint={{
                    "fill-color": "#ff0000",
                    "fill-opacity": 0.5,
                  }}
                />
              </Source>
            )}
          </Map>
        </MapProvider>
      </div>
    </div>
  );
}
