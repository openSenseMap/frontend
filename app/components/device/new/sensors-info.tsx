import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { getSensorsForModel } from "~/utils/model-definitions";
import { CustomDeviceConfig } from "./custom-device-config";

export const sensorSchema = z.object({
  title: z.string(),
  unit: z.string(),
  sensorType: z.string(),
  icon: z.string().optional(),
  image: z.string().optional(),
});

export type Sensor = z.infer<typeof sensorSchema>;

type SensorGroup = {
  sensorType: string;
  sensors: Sensor[];
  image?: string;
};

export function SensorSelectionStep() {
  const { watch, setValue } = useFormContext();
  const selectedDevice = watch("model");
  const [selectedDeviceModel, setSelectedDeviceModel] = useState<string | null>(
    null,
  );
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensors, setSelectedSensors] = useState<Sensor[]>([]);

  useEffect(() => {
    if (selectedDevice) {
      const deviceModel = selectedDevice.startsWith("homeV2")
        ? "senseBoxHomeV2"
        : selectedDevice;
      setSelectedDeviceModel(deviceModel);

      const fetchSensors = () => {
        const fetchedSensors = getSensorsForModel(deviceModel);
        setSensors(fetchedSensors);
      };
      fetchSensors();
    }
  }, [selectedDevice]);

  useEffect(() => {
    const savedSelectedSensors = watch("selectedSensors") || [];
    setSelectedSensors(savedSelectedSensors);
  }, [watch]);

  const groupSensorsByType = (sensors: Sensor[]): SensorGroup[] => {
    const grouped = sensors.reduce(
      (acc, sensor) => {
        if (!acc[sensor.sensorType]) {
          acc[sensor.sensorType] = [];
        }
        acc[sensor.sensorType].push(sensor);
        return acc;
      },
      {} as Record<string, Sensor[]>,
    );

    return Object.entries(grouped).map(([sensorType, sensors]) => ({
      sensorType,
      sensors,
      image: sensors.find((sensor) => sensor.image)?.image,
    }));
  };

  const sensorGroups = groupSensorsByType(sensors);

  const handleGroupToggle = (group: SensorGroup) => {
    const isGroupSelected = group.sensors.every((sensor) =>
      selectedSensors.some(
        (s) => s.title === sensor.title && s.sensorType === sensor.sensorType,
      ),
    );

    const updatedSensors = isGroupSelected
      ? selectedSensors.filter(
          (s) =>
            !group.sensors.some(
              (sensor) =>
                s.title === sensor.title && s.sensorType === sensor.sensorType,
            ),
        )
      : [
          ...selectedSensors,
          ...group.sensors.filter(
            (sensor) =>
              !selectedSensors.some(
                (s) =>
                  s.title === sensor.title &&
                  s.sensorType === sensor.sensorType,
              ),
          ),
        ];

    setSelectedSensors(updatedSensors);
    setValue("selectedSensors", updatedSensors);
  };

  const handleSensorToggle = (sensor: Sensor) => {
    const isAlreadySelected = selectedSensors.some(
      (s) => s.title === sensor.title && s.sensorType === sensor.sensorType,
    );

    const updatedSensors = isAlreadySelected
      ? selectedSensors.filter(
          (s) =>
            !(s.title === sensor.title && s.sensorType === sensor.sensorType),
        )
      : [...selectedSensors, sensor];

    setSelectedSensors(updatedSensors);
    setValue("selectedSensors", updatedSensors);
  };

  if (!selectedDevice) {
    return <p className="text-center text-lg">Please select a device first.</p>;
  }

  if (selectedDevice === "Custom") {
    return <CustomDeviceConfig />;
  }

  return (
    <div className="flex flex-col items-center h-full">
      <div className="container mx-auto p-4 bg-white rounded-md overflow-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sensorGroups.map((group) => {
            const isGroupSelected = group.sensors.every((sensor) =>
              selectedSensors.some(
                (s) =>
                  s.title === sensor.title &&
                  s.sensorType === sensor.sensorType,
              ),
            );

            return (
              <Card
                key={group.sensorType}
                className={cn(
                  "overflow-hidden cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105",
                  isGroupSelected
                    ? "ring-2 ring-primary shadow-lg"
                    : "hover:shadow-md",
                )}
                onClick={
                  selectedDeviceModel === "senseBoxHomeV2"
                    ? () => handleGroupToggle(group)
                    : undefined
                }
              >
                <CardContent className="p-6">
                  <h3
                    className="text-xl font-semibold break-words mb-4"
                    style={{ wordBreak: "break-word", whiteSpace: "normal" }}
                    title={group.sensorType}
                  >
                    {group.sensorType}
                  </h3>

                  <ul className="mb-4 space-y-2">
                    {group.sensors.map((sensor) => {
                      const isSelected = selectedSensors.some(
                        (s) =>
                          s.title === sensor.title &&
                          s.sensorType === sensor.sensorType,
                      );

                      return (
                        <li
                          key={sensor.title}
                          className={cn(
                            "text-sm text-gray-600 cursor-pointer px-2 py-1 rounded-md",
                            isSelected
                              ? "bg-primary text-white"
                              : "hover:bg-gray-100",
                          )}
                          onClick={
                            selectedDeviceModel !== "senseBoxHomeV2"
                              ? (e) => {
                                  e.stopPropagation();
                                  handleSensorToggle(sensor);
                                }
                              : undefined
                          }
                        >
                          {sensor.title} ({sensor.unit})
                        </li>
                      );
                    })}
                  </ul>
                  <div className="rounded-md h-32 w-32 flex items-center justify-center">
                    {group.image && (
                      <img
                        src={group.image}
                        alt={`${group.sensorType} placeholder`}
                        className="w-full h-full object-cover rounded-md"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
