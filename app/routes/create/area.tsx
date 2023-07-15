import Map from "~/components/Map";
import maplibregl from "maplibre-gl/dist/maplibre-gl.css";
import DrawControl from "~/components/Map/draw-control";
import {
  Layer,
  MapLayerMouseEvent,
  Popup,
  PopupProps,
  Source,
} from "react-map-gl";
import { MapProvider } from "react-map-gl";
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
import GeocoderControl from "~/components/Map/geocoder-control";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { Link } from "@remix-run/react";
import geocode from "@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css";
import draw from "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import type { LinksFunction } from "@remix-run/server-runtime";
import circleToPolygon from "circle-to-polygon";
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
  Popover,
  PopoverContent,
  PopoverArrow,
  PopoverAnchor,
} from "@/components/ui/popover";
import h337, { Heatmap } from "heatmap.js";
import { useTranslation } from "react-i18next";
import { useToast } from "~/components/ui/use-toast";
import {
  ZoomInIcon,
  ChevronRightIcon,
  ArrowRightCircleIcon,
  ArrowRightIcon,
  TrashIcon,
} from "lucide-react";
import zoomToExtent from "~/lib/zoom-to-extent";
import normalize from "@mapbox/geojson-normalize";

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

  const handleMapClick = useCallback((e: MapLayerMouseEvent) => {
    const { lngLat } = e;
    setPopup({
      latitude: lngLat.lat,
      longitude: lngLat.lng,
      className: "p-4",
      children: (
        <div className="my-2">
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
  }, []);

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
              title: "Erfolgreich importiert",
            });
          } else {
            console.error("Invalid GeoJSON file");
            // Display an error message to the user or handle the error appropriately
          }
        }
      };
      if (file) {
        reader.readAsText(file);
      }
    }
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
        <h1 className="ml-2 text-lg font-bold">
          {t("define area of interest")}
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Option 1: </CardTitle>
            <CardDescription>{t("draw area on the map")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setDrawPopoverOpen(!drawPopoverOpen)}>
              {t("draw")}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Option 2: </CardTitle>
            <CardDescription>{t("import geojson")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button>{t("import")}</Button>
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
      <div
        id="view-wrapper"
        className="fixed inset-y-0 right-0 z-0 col-span-2 h-full w-2/3"
      >
        <div className="h-full w-full" id="view">
          <div className="absolute right-4 top-4 z-50 ml-auto">
            <Button
              disabled={Object.keys(features).length === 0}
              onClick={() => zoomToExtent(mapRef.current, features[0])}
            >
              {t("Zoom to area")} <ZoomInIcon className="mx-2 h-4 w-4" />
            </Button>
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
                  {t(
                    "use these symbols to draw different geometries on the map"
                  )}
                  <PopoverArrow />
                </PopoverContent>
              </Popover>
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
              {popup && (
                <Popup
                  {...popup}
                  anchor="bottom"
                  onClose={() => setPopup(false)}
                />
              )}
            </Map>
          </MapProvider>
        </div>
      </div>
    </div>
  );
}
