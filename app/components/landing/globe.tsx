// src/Globe.tsx
import React, { useEffect, useRef, useState } from "react";

const GlobeComponent: React.FC = () => {
  const globeRef = useRef<any>(null);
  const [isBrowser, setIsBrowser] = useState(false);

  // rings data
  //   const ringN = 10;
  //   const ringData = [...Array(ringN).keys()].map(() => ({
  //     lat: (Math.random() - 0.5) * 180,
  //     lng: (Math.random() - 0.5) * 360,
  //     maxR: Math.random() * 5 + 3,
  //     propagationSpeed: (Math.random() - 0.5) * 10 + 1,
  //     repeatPeriod: Math.random() * 2000 + 200,
  //   }));

  const colors = ["#3D843F", "#037EA1"]; // Green and Blue

  // arcs data
  const arcN = 12;
  const arcsData = [...Array(arcN).keys()].map(() => ({
    startLat: (Math.random() - 0.5) * 180,
    startLng: (Math.random() - 0.5) * 360,
    endLat: (Math.random() - 0.5) * 180,
    endLng: (Math.random() - 0.5) * 360,
    color: [
      colors[Math.round(Math.random() * 1)], // Randomly pick either 0 or 1
      colors[Math.round(Math.random() * 1)], // Randomly pick either 0 or 1
    ],
  }));

  useEffect(() => {
    setIsBrowser(typeof window !== "undefined");
  }, []);

  useEffect(() => {
    const loadGlobe = async () => {
      if (isBrowser) {
        try {
          const Globe = (await import("globe.gl")).default;
          if (document.getElementById("globe")) {
            globeRef.current = Globe()(document.getElementById("globe")!)
              .globeImageUrl(
                "//unpkg.com/three-globe/example/img/earth-day.jpg",
              )
              .bumpImageUrl(
                "//unpkg.com/three-globe/example/img/earth-topology.png",
              )
              .pointOfView({ lat: 20, lng: 0 }, 1000)
              .backgroundColor("rgba(0, 0, 0, 0)");

            globeRef.current.controls().autoRotate = true;
            globeRef.current.controls().autoRotateSpeed = 1.0;
            globeRef.current.controls().enableZoom = false;

            // add rings
            // globeRef.current.ringsData(ringData);
            // globeRef.current.ringMaxRadius("maxR");
            // globeRef.current.ringPropagationSpeed("propagationSpeed");
            // globeRef.current.ringRepeatPeriod("repeatPeriod");

            // add arcs
            globeRef.current.arcsData(arcsData);
            globeRef.current.arcColor("color");
            globeRef.current.arcDashLength(Math.random() * (1 - 0.4) + 0.4);
            globeRef.current.arcDashGap(Math.random());
            globeRef.current.arcStroke(1);
            globeRef.current.arcDashAnimateTime(Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000);
          }
        } catch (error) {
          console.error("Error loading globe:", error);
        }
      }
    };

    loadGlobe();

    return () => {
      if (globeRef.current) {
        globeRef.current = null; // Cleanup on unmount
      }
    };
  }, [arcsData, isBrowser]);

  if (!isBrowser) return null; // Don't render anything on the server

  return (
    <div
      id="globe"
      style={{
        width: "500px",
        height: "500px",
        margin: 0,
        padding: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    />
  );
};

export default GlobeComponent;
