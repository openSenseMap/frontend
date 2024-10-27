"use client";

import { useEffect, useRef } from "react";
import Globe from "react-globe.gl";

export const GlobeComponent = () => {
  const globeEl = useRef<any>(null); // Use `any` as a quick workaround
  const colors = ["#3D843F", "#037EA1"];

  // arcs data
  const arcN = 12;
  const arcsData = [...Array(arcN).keys()].map(() => ({
    startLat: (Math.random() - 0.5) * 180,
    startLng: (Math.random() - 0.5) * 360,
    endLat: (Math.random() - 0.5) * 180,
    endLng: (Math.random() - 0.5) * 360,
    color: [
      colors[Math.round(Math.random() * 1)],
      colors[Math.round(Math.random() * 1)],
    ],
  }));

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 1.0;
      globeEl.current.controls().enableZoom = false;
    }
  }, []);

  return (
    <Globe
      ref={globeEl}
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
      bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
      backgroundColor="rgba(0, 0, 0, 0)"
      width={500}
      height={500}
      arcsData={arcsData}
      arcDashLength={Math.random() * (1 - 0.4) + 0.4}
      arcDashGap={Math.random() * (3 - 0.4) + 0.4}
      arcStroke={1}
      arcDashAnimateTime={Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000}
      arcColor={(d: any) => d.color}
    />
  );
};
