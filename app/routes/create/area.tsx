import maplibregl from "maplibre-gl/dist/maplibre-gl.css";
import {
  Layer,
  MapLayerMouseEvent,
  Popup,
  PopupProps,
  Source,
} from "react-map-gl";
import { useCallback, useContext, useState, useRef, useEffect } from "react";
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
import { Link } from "@remix-run/react";
import geocode from "@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css";
import draw from "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import type { LinksFunction } from "@remix-run/server-runtime";
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
import h337, { Heatmap } from "heatmap.js";
import { useTranslation } from "react-i18next";
import { useToast } from "~/components/ui/use-toast";
import { ArrowRightIcon } from "lucide-react";
import normalize from "@mapbox/geojson-normalize";
import bbox from "@turf/bbox";
import DefineAreaMap from "~/components/campaigns/area/map";

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
  const [geojsonUploadData, setGeojsonUploadData] = useState(null);
  const [drawPopoverOpen, setDrawPopoverOpen] = useState(false);
  const { features, setFeatures } = useContext(FeatureContext);
  const mapRef: any = useRef();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mouseData: any[][] = [];

  // const [container, setContainer] = useState<HTMLElement | undefined>(
  //   undefined
  // );
  // const [containerWrapper, setContainerWrapper] = useState<
  //   HTMLElement | undefined
  // >(undefined);

  // const heatMap = useRef<Heatmap<"value", "x", "y"> | null>(null);

  // useEffect(() => {
  //   if (typeof window != "undefined") {
  //     const container = document.getElementById("view")!;
  //     setContainer(container);
  //     const wrapper = document.getElementById("view-wrapper")!;
  //     setContainerWrapper(wrapper);
  //   }
  // }, []);

  // useEffect(() => {
  //   if (typeof window != "undefined") {
  //     var legendCanvas = document.createElement("canvas");
  //     legendCanvas.width = 100;
  //     legendCanvas.height = 10;
  //     var min = document.querySelector("#min");
  //     var max = document.querySelector("#max");
  //     var gradientImg = document.querySelector("#gradient");
  //     var legendCtx = legendCanvas.getContext("2d");
  //     var gradientCfg = {};

  //     function updateLegend(data: any) {
  //       // the onExtremaChange callback gives us min, max, and the gradientConfig
  //       // so we can update the legend
  //       min.innerHTML = data.min;
  //       max.innerHTML = data.max;
  //       // regenerate gradient image
  //       if (data.gradient != gradientCfg) {
  //         gradientCfg = data.gradient;
  //         var gradient = legendCtx.createLinearGradient(0, 0, 100, 1);
  //         for (var key in gradientCfg) {
  //           gradient.addColorStop(key, gradientCfg[key]);
  //         }
  //         legendCtx.fillStyle = gradient;
  //         legendCtx.fillRect(0, 0, 100, 10);
  //         gradientImg.src = legendCanvas.toDataURL();
  //       }
  //     }

  //     if (container) {
  //       heatMap.current = h337.create({
  //         container: container,
  //         onExtremaChange: function (data) {
  //           updateLegend(data);
  //         },
  //         radius: 25,
  //         maxOpacity: 0.5,
  //         minOpacity: 0.25,
  //         blur: 0.75,
  //       });
  //     }
  //     if (containerWrapper) {
  //       containerWrapper.onclick = function (ev: any) {
  //         if (heatMap.current) {
  //           heatMap.current.addData({
  //             x: ev.layerX,
  //             y: ev.layerY,
  //             value: 1,
  //           });
  //         }
  //       };
  //     }
  //   }
  // }, [container, containerWrapper]);

  // useEffect(() => {
  //   if (container) {
  //     heatMap.current = h337.create({
  //       container: container,
  //       maxOpacity: 0.6,
  //       radius: 50,
  //       blur: 0.9,
  //     });
  //     heatMap.current.setData({
  //       min: 0,
  //       max: 100,
  //       data: convertedData,
  //     });
  //   }
  // }, [container, convertedData]);

  const handleFileUpload = (event: any) => {
    if (fileInputRef.current != null) {
      const file = fileInputRef.current.files?.[0];
      // const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e?.target?.result;
        if (content && typeof content === "string") {
          const geojson = JSON.parse(content);
          if (valid(geojson)) {
            const normalized_geojson = normalize(geojson);
            setGeojsonUploadData(normalized_geojson);
            setFeatures(normalized_geojson);
            toast({
              title: `${t("imported sucessfully")}`,
              description: `${normalized_geojson.features.length} ${t(
                "features added"
              )}`,
            });
            const bounds = bbox(normalized_geojson);
            mapRef.current.fitBounds(bounds, {
              padding: 50,
              duration: 1000,
            });
            setPopup(false);
          } else {
            toast({
              title: `${t("import failed")}`,
              description: `${t("upload a file that contains valid geojson")}`,
            });
          }
        }
      };
      if (file) {
        reader.readAsText(file);
      }
    }
  };

  return (
    <div
      // id="view-wrapper"
      className="grid h-full w-full grid-cols-3 gap-4" //TODO: change grid layout
      onClick={(e: any) => {
        mouseData.push([e.clientX, e.clientY, 30]);
        localStorage.setItem("area", JSON.stringify(mouseData));
      }}
    >
      {/* <div id="heatmapLegend" className="lef-0 absolute bottom-0 bg-white p-4">
        <h2>Legend</h2>
        <span className="float-left" id="min"></span>
        <span className="float-right" id="max"></span>
        <img className="w-full" id="gradient" src="" alt="legend-gradient" />
      </div> */}
      <div className="flex w-2/3 flex-col gap-3">
        <div className="m-2 flex flex-col gap-1">
          <h1 className="text-lg font-bold">{t("define area of interest")}</h1>
          <span>
            Bestimme zunächst das Gebiet, in dem deine Kampagne stattfinden
            soll.
          </span>
          <span>Wähle hierfür eine der folgenden Optionen:</span>
        </div>
        <div className="m-4 flex gap-2">
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
                  <input type="file" accept=".geojson" ref={fileInputRef} />
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
      <div
        id="view-wrapper"
        className="fixed inset-y-0 right-0 z-0 col-span-2 h-full w-2/3"
      >
        <div className="h-full w-full" id="view">
          <div className="absolute right-4 top-4 z-50 ml-auto">
            {/* <Button
              disabled={Object.keys(features).length === 0}
              onClick={() => zoomToExtent(mapRef.current, features[0])}
            >
              {t("Zoom to area")} <ZoomInIcon className="mx-2 h-4 w-4" />
            </Button> */}
            <Link to={"/create/form"} className="ml-2">
              <Button
                // className="absolute right-4 top-4 z-50 ml-auto"
                disabled={Object.keys(features).length === 0}
              >
                {t("next")}
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
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
