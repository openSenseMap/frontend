import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { Sensor } from "./sensors-info";
import { X } from "lucide-react";
import { Separator } from "~/components/ui/separator";

export function CustomDeviceConfig() {
  const { setValue, watch } = useFormContext();

  // Initialize state from form context
  const [sensors, setSensors] = useState<Sensor[]>(
    () => watch("selectedSensors") || [],
  );
  const [newSensor, setNewSensor] = useState<Sensor>({
    title: "",
    unit: "",
    sensorType: "",
  });

  // Sync state with form context on mount
  useEffect(() => {
    const savedSensors = watch("selectedSensors") || [];
    if (savedSensors.length > 0) {
      setSensors(savedSensors);
    }
  }, [watch]);

  const updateNewSensor = (field: keyof Sensor, value: string) => {
    setNewSensor((prev) => ({ ...prev, [field]: value }));
  };

  const addSensor = () => {
    if (newSensor.title && newSensor.unit && newSensor.sensorType) {
      const updatedSensors = [...sensors, newSensor];
      setSensors(updatedSensors);
      setValue("selectedSensors", updatedSensors); // Sync with form
      setNewSensor({ title: "", unit: "", sensorType: "" });
    }
  };

  const removeSensor = (index: number) => {
    const updatedSensors = sensors.filter((_, i) => i !== index);
    setSensors(updatedSensors);
    setValue("selectedSensors", updatedSensors); // Sync with form
  };

  return (
    <div className="space-y-4 p-2">
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="phenomenon">Phenomenon</Label>
            <Input
              id="phenomenon"
              value={newSensor.title}
              onChange={(e) => updateNewSensor("title", e.target.value)}
              placeholder="e.g., Temperature"
            />
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Input
              id="unit"
              value={newSensor.unit}
              onChange={(e) => updateNewSensor("unit", e.target.value)}
              placeholder="e.g., °C"
            />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Input
              id="type"
              value={newSensor.sensorType}
              onChange={(e) => updateNewSensor("sensorType", e.target.value)}
              placeholder="e.g., HDC1080"
            />
          </div>
        </div>
        <Button
          onClick={addSensor}
          disabled={
            !newSensor.title || !newSensor.unit || !newSensor.sensorType
          }
        >
          Add Sensor
        </Button>
      </div>

      {sensors.length > 0 && <Separator />}
      {sensors.map((sensor, index) => (
        <Card key={index} className="mb-2">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <span className="font-medium">{sensor.title}</span> ({sensor.unit}
              ) - {sensor.sensorType}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                removeSensor(index);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
