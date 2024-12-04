import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { getSensorsForModel } from "~/utils/model-definitions";

type Sensor = {
  title: string;
  unit: string;
  sensorType: string;
  icon: string;
};

type SensorGroup = {
  sensorType: string;
  measurements: Sensor[];
};

export function SensorSelectionStep() {
  const { watch, setValue } = useFormContext();
  const selectedDevice = watch("hardwareId");
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensorTypes, setSelectedSensorTypes] = useState<string[]>([]);

  useEffect(() => {
    if (selectedDevice) {
      const fetchSensors = async () => {
        const fetchedSensors = await getSensorsForModel(selectedDevice);
        setSensors(fetchedSensors);
      };

      fetchSensors();
    }
  }, [selectedDevice]);

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

    return Object.entries(grouped).map(([sensorType, measurements]) => ({
      sensorType,
      measurements,
    }));
  };

  const sensorGroups = groupSensorsByType(sensors);

  const handleSensorTypeToggle = (sensorType: string) => {
    const updatedSensorTypes = selectedSensorTypes.includes(sensorType)
      ? selectedSensorTypes.filter((type) => type !== sensorType)
      : [...selectedSensorTypes, sensorType];

    setSelectedSensorTypes(updatedSensorTypes);

    // Update the selected sensors in form state
    const updatedSensors = sensors.filter((sensor) =>
      updatedSensorTypes.includes(sensor.sensorType),
    );
    setValue(
      "selectedSensors",
      updatedSensors.map((sensor) => sensor.sensorType),
    );
  };

  if (!selectedDevice) {
    return <p className="text-center text-lg">Please select a device first.</p>;
  }

  return (
    <div className="flex flex-col items-center h-full">
      <div className="container mx-auto p-4 bg-white rounded-md overflow-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sensorGroups.map((group) => {
            const isSelected = selectedSensorTypes.includes(group.sensorType);

            return (
              <Card
                key={group.sensorType}
                className={cn(
                  "overflow-hidden cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105",
                  isSelected
                    ? "ring-2 ring-primary shadow-lg"
                    : "hover:shadow-md",
                )}
                onClick={() => handleSensorTypeToggle(group.sensorType)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="text-xl font-semibold break-words w-full"
                      style={{ wordBreak: "break-word", whiteSpace: "normal" }}
                      title={group.sensorType} // Add this to show the full text on hover
                    >
                      {group.sensorType}
                    </h3>
                  </div>
                  <ul className="mb-4">
                    {group.measurements.map((measurement) => (
                      <li
                        key={measurement.title}
                        className="text-sm text-gray-600"
                      >
                        {measurement.title} ({measurement.unit})
                      </li>
                    ))}
                  </ul>
                  <div className="h-32 bg-gray-100 rounded-md flex items-center justify-center">
                    <img
                      src={`/placeholder.svg?height=128&width=256`}
                      alt={`${group.sensorType} placeholder`}
                      className="w-full h-full object-cover rounded-md"
                    />
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
