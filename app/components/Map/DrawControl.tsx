import MapboxDraw, { modes } from "@mapbox/mapbox-gl-draw";
import { useControl } from "react-map-gl";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { CircleMode, DragCircleMode } from "maplibre-gl-draw-circle";
import DrawRectangle from "mapbox-gl-draw-rectangle-mode";
import type { MapRef, ControlPosition } from "react-map-gl";

type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
  position?: ControlPosition;

  onCreate?: (evt: { features: object[] }) => void;
  onUpdate?: (evt: { features: object[]; action: string }) => void;
  onDelete?: (evt: { features: object[] }) => void;
};

let draw: MapboxDraw | null = null;

class MyCustomControl {
  containerCir: HTMLButtonElement | undefined;
  containerRec: HTMLButtonElement | undefined;
  map: any;
  containerImgCir: HTMLImageElement | undefined;
  containerImgRec: HTMLImageElement | undefined;
  mainContainer: HTMLDivElement | undefined;
  container: any;

  onAdd(map: any) {
    if (this.mainContainer) {
      // If the buttons have already been created, return the existing container
      return this.mainContainer;
    }
    this.containerCir = document.createElement("button");
    this.containerRec = document.createElement("button");

    this.map = map;

    this.containerCir.onclick = () => {
      const zoom = this.map.getZoom();
      draw?.changeMode("drag_circle", {
        initialRadiusInKm: 1 / Math.pow(2, zoom - 11),
      });
      draw?.delete("-96.5801808656236544.76489866786821");
    };
    this.containerCir.className =
      "mapbox-gl-draw_ctrl-draw-btn my-custom-control-cir";
    // this.containerCir.innerHTML = "&#x25EF";
    this.containerImgCir = document.createElement("img");
    this.containerImgCir.src =
      " https://cdn-icons-png.flaticon.com/16/808/808569.png";
    this.containerCir.appendChild(this.containerImgCir);

    this.containerRec.onclick = () => {
      draw?.changeMode("draw_rectangle");
    };
    this.containerRec.className =
      "mapbox-gl-draw_ctrl-draw-btn my-custom-control-rec";
    // this.containerRec.innerHTML = "&#9645";
    this.containerRec.className = "h-[29px] w-[29px]";

    this.containerImgRec = document.createElement("img");
    this.containerImgRec.src =
      "  https://cdn-icons-png.flaticon.com/16/7367/7367908.png";
    this.containerRec.appendChild(this.containerImgRec);

    this.mainContainer = document.createElement("div");

    this.mainContainer.className = "mapboxgl-ctrl-group mapboxgl-ctrl";
    this.mainContainer.appendChild(this.containerCir);
    this.mainContainer.appendChild(this.containerRec);

    return this.mainContainer;
  }
  onRemove() {
    this.container.parentNode.removeChild(this.container);
    this.map = undefined;
  }
}
export default function DrawControl(props: DrawControlProps) {
  const myCustomControl = new MyCustomControl();
  useControl<MapboxDraw>(
    () => {
      draw = new MapboxDraw({
        ...props,
        modes: {
          ...modes,
          draw_circle: CircleMode,
          drag_circle: DragCircleMode,
          draw_rectangle: DrawRectangle,
        },
        // defaultMode: "drag_circle",
      });
      return draw;
    },
    ({ map }: { map: MapRef }) => {
      props.onCreate && map.on("draw.create", props.onCreate);
      props.onUpdate && map.on("draw.update", props.onUpdate);
      props.onDelete && map.on("draw.delete", props.onDelete);

      map.addControl(myCustomControl, "top-left");
    },
    ({ map }: { map: MapRef }) => {
      props.onCreate && map.off("draw.create", props.onCreate);
      props.onUpdate && map.off("draw.update", props.onUpdate);
      props.onDelete && map.off("draw.delete", props.onDelete);
    },
    {
      position: props.position,
    }
  );

  return null;
}

DrawControl.defaultProps = {
  onCreate: () => {},
  onUpdate: () => {},
  onDelete: () => {},
};
