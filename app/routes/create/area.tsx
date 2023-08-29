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
  LoaderArgs,
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
import h337, { DataPoint, Heatmap } from "heatmap.js";
import { useTranslation } from "react-i18next";
import { useToast } from "~/components/ui/use-toast";
import { ArrowRightIcon } from "lucide-react";
import normalize from "@mapbox/geojson-normalize";
import flatten from "geojson-flatten";
import bbox from "@turf/bbox";
import DefineAreaMap from "~/components/campaigns/area/map";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import { createClick, getClicks } from "~/models/clicks.server";
import { triggerNotification } from "~/novu.server";

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

export async function loader({ request }: LoaderArgs) {
  await triggerNotification();
  return null;
}
// export async function action({ request }: ActionArgs) {
//   const formData = await request.formData();
//   const x_string = formData.get("x");
//   if (typeof x_string != "string") {
//     throw Error("x has to be a number");
//   }
//   const x_number = parseInt(x_string);
//   // ... validate other data
//   await createClick({
//     x: x_number,
//     y: y_number,
//     page,
//     viewportWidth: viewportWidth_number,
//     viewportHeight: viewportHeight_number,
//   });

//   return null;
// }

export default function CampaignArea() {
  const { t } = useTranslation("campaign-area");
  const { toast } = useToast();
  const data = useLoaderData<typeof loader>();

  const [popup, setPopup] = useState<PopupProps | false>();
  const [geojsonUploadData, setGeojsonUploadData] = useState<FeatureCollection<
    Geometry,
    GeoJsonProperties
  > | null>(null);
  const [drawPopoverOpen, setDrawPopoverOpen] = useState(false);
  const { features, setFeatures } = useContext(FeatureContext);
  const mapRef = useRef<MapRef | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mouseData: any[][] = [];
  // const points: DataPoint<"value", "x", "y">[] = [];
  // data.forEach((d) => {
  //   const point = {
  //     x: d.x,
  //     y: d.y,
  //     value: 1,
  //   };
  //   points.push(point);
  // });

  const submit = useSubmit();

  // function handleClick(e: any) {
  //   const x = e.clientX;
  //   const y = e.clientY;
  //   const page = "area";
  //   const viewportWidth = window.innerWidth;
  //   const viewportHeight = window.innerHeight;
  //   const formData = new FormData();
  //   formData.set("x", x);
  //   formData.set("y", y);
  //   formData.set("page", page);
  //   formData.set("viewportWidth", viewportWidth.toString());
  //   formData.set("viewportHeight", viewportHeight.toString());
  //   submit(formData, { method: "post" });
  // }

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

  function readFileAsync(file: File) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = reject;

      reader.readAsText(file);
    });
  }

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
    <div
      id="view-wrapper"
      //rest of component
      // className="grid h-full w-full grid-cols-3 gap-4" //TODO: change grid layout
      onClick={(e: any) => {
        mouseData.push([e.clientX, e.clientY, 30]);
        localStorage.setItem("area", JSON.stringify(mouseData));
      }}
    >
      {/* <div id="heatmapLegend" className="absolute bottom-0 left-0 bg-white p-4">
        <h2>Legend</h2>
        <span className="float-left" id="min"></span>
        <span className="float-right" id="max"></span>
        <img className="w-full" id="gradient" src="" alt="legend-gradient" />
      </div> */}
      {/* <div id="view" className="h-full w-full"> */}
      <div className="flex w-2/3 flex-col gap-3">
        <div className="m-2 flex flex-col gap-1">
          <h1 className="text-lg font-bold">{t("define area of interest")}</h1>
          <span>
            {t(
              "first, determine the area where your campaign should take place."
            )}
          </span>
          <span>{t("choose one of the following options:")}</span>
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
      <div
        // id="view-wrapper"
        className="fixed inset-y-0 right-0 z-0 col-span-2 h-full w-2/3"
      >
        <div className="h-full w-full">
          <Link
            to={"/create/form"}
            className="absolute right-4 top-4 z-50 ml-auto"
          >
            <Button
              // className="absolute right-4 top-4 z-50 ml-auto"
              disabled={Object.keys(features).length === 0}
            >
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
    // </div>
  );
}
