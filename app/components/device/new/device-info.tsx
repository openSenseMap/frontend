import { useFormContext } from "react-hook-form";
import { cn } from "~/lib/utils";

type Device = "senseBoxHomeV2" | "senseBoxEdu" | "luftdatenInfo";

export function DeviceSelectionStep() {
  const { setValue, watch } = useFormContext();
  const selectedDevice = watch("hardwareId");

  const handleDeviceChange = (value: Device) => {
    setValue("hardwareId", value); // Update form state with selected device
  };

  const devices: Device[] = ["senseBoxHomeV2", "senseBoxEdu", "luftdatenInfo"];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-6">Select a Device</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <div
            key={device}
            className={cn(
              "overflow-hidden cursor-pointer p-4 border rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-md",
              selectedDevice === device
                ? "ring-2 ring-primary bg-primary/10 shadow-lg"
                : "bg-white hover:bg-gray-50",
            )}
            onClick={() => handleDeviceChange(device)}
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold">{device}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
