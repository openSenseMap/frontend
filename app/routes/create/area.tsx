import Map from "~/components/Map";
import maplibregl from "maplibre-gl/dist/maplibre-gl.css";
import DrawControl from "~/components/Map/DrawControl";
import type { LinksFunction } from "@remix-run/node";
import type { MapRef } from "react-map-gl";
import { MapProvider } from "react-map-gl";
import { useCallback, useContext, useRef, useState } from "react";
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
import clsx from "clsx";

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: maplibregl,
    },
  ];
};

export default function Explore() {
  // const [drawPolygon, setDrawPolygon] = useState(false);
  const { features, setFeatures } = useContext(FeatureContext);
  const mapRef = useRef<MapRef>(null);
  const onUpdate = useCallback((e: any) => {
    setFeatures((currFeatures: any) => {
      const updatedFeatures = e.features.map((f: any) => {
        return { ...f };
      });
      return updatedFeatures;
    });
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
      <div className="">
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
              <Button>Importieren</Button>
            </CardContent>
          </Card>
        </div>
        <div className="fixed inset-y-0 right-0 z-50 h-full w-2/3">
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
              ref={mapRef}
              initialViewState={{ latitude: 7, longitude: 52, zoom: 2 }}
            >
              <GeocoderControl
                language="de"
                onResult={(e) => console.log(e)}
                position="top-left"
              />
              <DrawControl
                position="top-left"
                displayControlsDefault={false}
                controls={{ polygon: true, point: true, trash: true }}
                onCreate={onUpdate}
                onUpdate={onUpdate}
                onDelete={onDelete}
                // defaultMode={drawPolygon ? "draw_polygon" : "simple_select"}
              />
            </Map>
          </MapProvider>
        </div>
      </div>
    </div>
  );
}
