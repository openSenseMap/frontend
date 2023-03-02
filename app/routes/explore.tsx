import { LinksFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import Map from "~/components/Map";
import maplibregl from "maplibre-gl/dist/maplibre-gl.css";
import Header from "~/components/header/Header";

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: maplibregl,
    },
  ];
};

export default function Explore() {
  return (
    <div className="h-full w-full">
      <Header />
      <Map />
      <main className="absolute bottom-0 z-10 w-full">
        <Outlet />
      </main>
    </div>
  );
}
