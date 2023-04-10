import Home from "./home/Home";
import NavBar from "./navBar/NavBar";
import Menu from "./menu/Menu";
import type { MapRef } from "react-map-gl";
import { RefObject } from "react";

interface Props {
  mapRef: RefObject<MapRef>;
  devices: any;
}

export default function Header(props: Props) {
  return (
    <div className="flex items-center p-2 w-full h-14 fixed z-10 pointer-events-none">
        <Home />
        <NavBar mapRef={props.mapRef} devices={props.devices} />
        <Menu />
    </div>
  );
}