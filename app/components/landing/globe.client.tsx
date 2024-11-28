"use client";

import { useEffect, useRef } from "react";
import Globe from "react-globe.gl";

export const GlobeComponent = () => {
  const globeEl = useRef<any>(null);

  // Example sensor data with lat/lng, max radius, propagation speed, and repeat period
  const sensorData = [
    {
      lat: 52.52,
      lng: 13.405,
      maxR: 10,
      propagationSpeed: 5,
      repeatPeriod: 1000,
    }, // Berlin
    {
      lat: 48.8566,
      lng: 2.3522,
      maxR: 12,
      propagationSpeed: 4,
      repeatPeriod: 1200,
    }, // Paris
    {
      lat: 40.7128,
      lng: -74.006,
      maxR: 8,
      propagationSpeed: 6,
      repeatPeriod: 900,
    }, // New York
    // Add more locations here
  ];

  const colorInterpolator = (t: any) => `rgba(255,100,50,${Math.sqrt(1 - t)})`;

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
      ringsData={sensorData}
      ringColor={() => colorInterpolator}
      ringMaxRadius="maxR"
      ringPropagationSpeed="propagationSpeed"
      ringRepeatPeriod="repeatPeriod"
    />
  );
};
