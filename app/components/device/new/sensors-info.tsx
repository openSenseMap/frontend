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

export function SensorSelectionStep() {
  const { watch, setValue } = useFormContext();
  const selectedDevice = watch("hardwareId");
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);

  useEffect(() => {
    if (selectedDevice) {
      const fetchSensors = async () => {
        const fetchedSensors = await getSensorsForModel(selectedDevice);
        setSensors(fetchedSensors);
      };

      fetchSensors();
    }
  }, [selectedDevice]);

  const handleSensorToggle = (sensorId: string) => {
    const updatedSensors = selectedSensors.includes(sensorId)
      ? selectedSensors.filter((id) => id !== sensorId)
      : [...selectedSensors, sensorId];

    setSelectedSensors(updatedSensors);
    setValue("selectedSensors", updatedSensors); // Update form state with selected sensors
  };

  if (!selectedDevice) {
    return <p className="text-center text-lg">Please select a device first.</p>;
  }

  return (
    <div className="flex flex-col items-center h-full">
      <h2 className="text-3xl font-bold mb-4">Select Sensors</h2>
      <div className="container mx-auto p-4 bg-white rounded-md shadow-md h-full max-h-[80vh] overflow-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sensors.map((sensor, index) => {
            // Create a unique ID for each sensor using its index and sensorType
            const sensorId = `${sensor.sensorType}-${index}`;

            return (
              <Card
                key={sensorId}
                className={cn(
                  "overflow-hidden cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105",
                  selectedSensors.includes(sensorId)
                    ? "ring-2 ring-primary shadow-lg"
                    : "hover:shadow-md",
                )}
                onClick={() => handleSensorToggle(sensorId)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">{sensor.title}</h3>
                    <span className="text-sm text-gray-500">{sensor.unit}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {sensor.sensorType}
                  </p>
                  <div className="h-32 bg-gray-100 rounded-md flex items-center justify-center">
                    <img
                      src={`/placeholder.svg?height=128&width=256`}
                      alt={`${sensor.title} placeholder`}
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
