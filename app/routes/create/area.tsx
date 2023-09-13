import maplibregl from "maplibre-gl/dist/maplibre-gl.css";
import type { MapRef, PopupProps } from "react-map-gl";
import { useContext, useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "~/components/ui/button";
import { FeatureContext } from "../create";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { Form, Link, useLoaderData, useSubmit } from "@remix-run/react";
import geocode from "@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css";
import draw from "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import {
  redirect,
  type ActionArgs,
  type LinksFunction,
} from "@remix-run/server-runtime";
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
import { useTranslation } from "react-i18next";
import { useToast } from "~/components/ui/use-toast";
import { ArrowRightIcon } from "lucide-react";
import normalize from "@mapbox/geojson-normalize";
import flatten from "geojson-flatten";
import bbox from "@turf/bbox";
import DefineAreaMap from "~/components/campaigns/area/map";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import readFileAsync from "~/lib/read-file-async";

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

export default function CampaignArea() {
  const { t } = useTranslation("campaign-area");
  const { toast } = useToast();

  const [popup, setPopup] = useState<PopupProps | false>();
  const [geojsonUploadData, setGeojsonUploadData] = useState<FeatureCollection<
    Geometry,
    GeoJsonProperties
  > | null>(null);
  const [drawPopoverOpen, setDrawPopoverOpen] = useState(false);
  const { features, setFeatures } = useContext(FeatureContext);
  const mapRef = useRef<MapRef | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async () => {
    if (!fileInputRef.current) return null;
    const file = fileInputRef.current.files?.[0];
    if (!file) {
      toast({
        title: `${t("import failed")}`,
        description: `${t("No file selected")}`,
      });
      return null;
    }
    try {
      const fileContent = await readFileAsync(file);
      const geojson = JSON.parse(fileContent);
      if (!valid(geojson)) {
        toast({
          title: `${t("import failed")}`,
          description: `${t(
            "please upload a file that contains valid geojson"
          )}`,
        });
        return null;
      }
      // store features in this format consistently
      const normalized_geojson = normalize(geojson);
      const flattened_geojson = flatten(normalized_geojson);
      // update state of source data for the layer
      setGeojsonUploadData(flattened_geojson);
      setFeatures(flattened_geojson);

      const [x1, y1, x2, y2] = bbox(flattened_geojson);
      if (mapRef.current) {
        mapRef.current.fitBounds([x1, y1, x2, y2], {
          padding: 50,
          duration: 1000,
        });
        setPopup(false); // reset popup state
      }
      toast({
        title: `${t("imported sucessfully")}`,
        description: `${flattened_geojson.features.length} ${t(
          "features added"
        )}`,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: `${t("Something went wrong")}`,
        description: `${t("please try again")}`,
      });
    }
  };

  return (
    <div className="flex flex-col md:flex-row">
      <div className="flex w-full flex-col gap-3 md:w-1/4">
        <div className="m-2 flex flex-col gap-1">
          <h1 className="text-lg font-bold">{t("define area of interest")}</h1>
          <span>
            {t(
              "first, determine the area where your campaign should take place."
            )}
          </span>
          <span>{t("choose one of the following options:")}</span>
        </div>
        <div className="m-4 flex flex-col gap-2">
          <Card>
            <CardHeader>
              <CardTitle className="whitespace-nowrap">Option 1: </CardTitle>
              <CardDescription>{t("draw area on the map")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="float-right m-2"
                onClick={() => setDrawPopoverOpen(!drawPopoverOpen)}
              >
                {t("draw")}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="whitespace-nowrap">Option 2: </CardTitle>
              <CardDescription>{t("import geojson")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="float-right m-2">{t("import")}</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t("upload geojson file")}</DialogTitle>
                    <DialogDescription>
                      {t("upload a valid geojson file here")}
                    </DialogDescription>
                  </DialogHeader>
                  <input
                    type="file"
                    accept=".geojson, .json"
                    ref={fileInputRef}
                  />
                  <DialogFooter>
                    <DialogClose>
                      <Button onClick={handleFileUpload}>{t("select")}</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="relative bottom-0 z-0 h-96 w-full md:fixed md:inset-y-0 md:right-0 md:h-full md:w-2/3">
        <div className="h-full w-full">
          <Link
            to={"/create/form"}
            className="absolute right-4 top-4 z-50 ml-auto"
          >
            <Button disabled={Object.keys(features).length === 0}>
              {t("next")}
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <DefineAreaMap
            setFeatures={setFeatures}
            drawPopoverOpen={drawPopoverOpen}
            setDrawPopoverOpen={setDrawPopoverOpen}
            geojsonUploadData={geojsonUploadData}
            setGeojsonUploadData={setGeojsonUploadData}
            mapRef={mapRef}
          />
        </div>
      </div>
    </div>
  );
}
