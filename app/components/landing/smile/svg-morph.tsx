"use client";
import { interpolate } from "flubber";
import React, { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

interface SVGMorphProps {
  paths: string[];
  isHovered: boolean;
}

export default function SVGMorph({ paths, isHovered }: SVGMorphProps) {
  const progress = useMotionValue(0);
  const path = useTransform(progress, [0, 1], paths, {
    mixer: (a, b) => interpolate(a, b, { maxSegmentLength: 1 }),
  });

  useEffect(() => {
    const animation = animate(progress, isHovered ? 1 : 0, {
      duration: 0.4, // Smooth transition duration
      ease: "easeInOut",
    });
    return () => animation.stop();
  }, [isHovered]); // Trigger animation based on hover state

  return <motion.path fill="#3D843F" d={path} />;
}
