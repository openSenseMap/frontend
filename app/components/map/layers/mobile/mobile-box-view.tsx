/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Sensor } from "~/schema";
import MobileBoxLayer from "./mobile-box-layer";
import { HIGH_COLOR, LOW_COLOR } from "./color-palette";
import { useEffect, useRef, useState } from "react";

export default function MobileBoxView({ sensors }: { sensors: Sensor[] }) {
  return (
    <div className="absolute top-10 right-0 flex flex-col gap-4 p-4">
      {sensors.map((sensor) => (
        <SensorView sensor={sensor} key={sensor.id} />
      ))}
    </div>
  );
}

function SensorView({ sensor }: { sensor: Sensor }) {
  const [minColor, setMinColor] = useState(LOW_COLOR);
  const [maxColor, setMaxColor] = useState(HIGH_COLOR);

  return (
    <>
      <Legend
        sensor={sensor}
        key={"Legend_" + sensor.id}
        onColorChange={(min, max) => {
          setMinColor(min);
          setMaxColor(max);
        }}
      />
      <MobileBoxLayer
        sensor={sensor}
        key={sensor.id}
        minColor={minColor}
        maxColor={maxColor}
      />
    </>
  );
}

function Legend({
  sensor,
  onColorChange,
}: {
  sensor: Sensor;
  onColorChange?: (min: string, max: string) => void;
}) {
  const minColorInputRef = useRef<HTMLInputElement>(null);
  const maxColorInputRef = useRef<HTMLInputElement>(null);

  const [minColor, setMinColor] = useState(LOW_COLOR);
  const [maxColor, setMaxColor] = useState(HIGH_COLOR);

  useEffect(() => {
    onColorChange && onColorChange(minColor, maxColor);
  }, [minColor, maxColor, onColorChange]);

  const sensorData = sensor.data! as unknown as {
    value: String;
    location: { x: number; y: number; id: number };
    createdAt: Date;
  }[];

  const minValue = Math.min(...sensorData.map((d) => Number(d.value)));
  const maxValue = Math.max(...sensorData.map((d) => Number(d.value)));

  return (
    <div className="flex w-40 flex-col gap-2 rounded-lg border-gray-200 bg-white p-2 shadow-sm z-50">
      <span className="font-semibold">{sensor.title}</span>
      <div
        className="flex w-full items-center justify-between rounded-sm p-1"
        style={{
          background: `linear-gradient(90deg, ${minColor} 0%, ${maxColor} 100%)`,
        }}
      >
        <div
          className="cursor-pointer rounded bg-white px-0.5 shadow-sm"
          onClick={() => minColorInputRef.current?.click()}
        >
          {minValue}
          {sensor.unit}
          <input
            type="color"
            ref={minColorInputRef}
            className="hidden"
            value={minColor}
            onChange={(e) => setMinColor(e.target.value)}
          />
        </div>
        <span
          className="cursor-pointer rounded bg-white px-0.5 shadow-sm"
          onClick={() => maxColorInputRef.current?.click()}
        >
          {maxValue}
          {sensor.unit}
          <input
            className="hidden"
            type="color"
            ref={maxColorInputRef}
            defaultValue={maxColor}
            onChange={(e) => setMaxColor(e.target.value)}
          />
        </span>
      </div>
    </div>
  );
}
