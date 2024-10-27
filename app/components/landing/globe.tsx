// src/Globe.tsx
import React, { useEffect, useRef, useState } from "react";

const GlobeComponent: React.FC = () => {
  const globeRef = useRef<any>(null);
  const [isBrowser, setIsBrowser] = useState(false);

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
            globeRef.current.controls().enableZoom = false;
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
  }, [isBrowser]);

  if (!isBrowser) return null; // Don't render anything on the server

  return (
    <div
      id="globe"
      style={{
        width: "500px",
        height: "500px",
        margin: 0, // Remove any margin
        padding: 0, // Remove any padding
        display: "flex",
        justifyContent: "center", // Center the globe if needed
        alignItems: "center", // Center the globe if needed
      }}
    />
  );
};

export default GlobeComponent;
