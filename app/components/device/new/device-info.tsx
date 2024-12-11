import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";

const devices = [
  {
    name: "senseBox:Home",
    image:
      "https://sensebox.kaufen/api//public/uploads/thumbs/thumb--1525013086964-mcu_one_top.png",
  },
  {
    name: "senseBox:Edu",
    image:
      "https://sensebox.kaufen/api//public/uploads/thumbs/thumb--1524084284270-mcu%20top.png",
  },
  {
    name: "luftdaten.info",
    image:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXdpbmQiPjxwYXRoIGQ9Ik0xMi44IDE5LjZBMiAyIDAgMSAwIDE0IDE2SDIiLz48cGF0aCBkPSJNMTcuNSA4YTIuNSAyLjUgMCAxIDEgMiA0SDIiLz48cGF0aCBkPSJNOS44IDQuNEEyIDIgMCAxIDEgMTEgOEgyIi8+PC9zdmc+",
  },
  {
    name: "Custom",
    image:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXdyZW5jaCI+PHBhdGggZD0iTTE0LjcgNi4zYTEgMSAwIDAgMCAwIDEuNGwxLjYgMS42YTEgMSAwIDAgMCAxLjQgMGwzLjc3LTMuNzdhNiA2IDAgMCAxLTcuOTQgNy45NGwtNi45MSA2LjkxYTIuMTIgMi4xMiAwIDAgMS0zLTNsNi45MS02LjkxYTYgNiAwIDAgMSA3Ljk0LTcuOTRsLTMuNzYgMy43NnoiLz48L3N2Zz4=",
  },
];

const connectionTypes = ["Wifi", "Lora", "Ethernet"];

export function DeviceSelectionStep() {
  const { setValue, watch } = useFormContext();

  // Watch the existing values from the form state
  const model = watch("model");

  // Initialize component state with form values
  const [selectedDevice, setSelectedDevice] = useState(model || null);
  const [selectedConnectionType, setSelectedConnectionType] = useState("");

  useEffect(() => {
    if (
      model === "homeV2Wifi" ||
      model === "homeV2Ethernet" ||
      model === "homeV2Lora"
    ) {
      setSelectedDevice("senseBox:Home");
      const connectionMap: Record<string, string> = {
        homeV2Wifi: "Wifi",
        homeV2Ethernet: "Ethernet",
        homeV2Lora: "Lora",
      };
      setSelectedConnectionType(connectionMap[model] || "");
    } else {
      setSelectedDevice(model || "");
      setSelectedConnectionType("");
    }
  }, [model]);

  const handleDeviceChange = (value: string) => {
    setValue("selectedSensors", null); // Reset the selected sensors
    if (selectedDevice === value) {
      // Deselect the currently selected device
      setSelectedDevice(null);
      setValue("model", ""); // Reset the model
    } else {
      // Select a new device
      setSelectedDevice(value);

      // Set the model for the selected device
      if (value === "senseBox:Home") {
        setValue("model", "homeV2Wifi"); // Default to a valid connection type for Home
      } else {
        setValue("model", value); // Set model to the selected device name
      }
    }
  };

  const handleConnectionTypeChange = (type: string) => {
    // Dynamically set the model based on the connection type
    const modelMap: Record<string, string> = {
      Wifi: "homeV2Wifi",
      Ethernet: "homeV2Ethernet",
      Lora: "homeV2Lora",
    };
    setValue("model", modelMap[type]);
    setSelectedConnectionType(type); // Update local state
  };

  const handleClose = () => {
    setSelectedDevice(null);
    setValue("model", null);
  };

  return (
    <div className="p-4 overflow-hidden">
      <div
        className={cn(
          "grid gap-6",
          selectedDevice === "senseBox:Home" ? "grid-cols-1" : "grid-cols-2",
        )}
      >
        {devices.map((device) => {
          if (
            selectedDevice === "senseBox:Home" &&
            device.name !== selectedDevice
          )
            return null;

          return (
            <Card
              key={device.name}
              className={cn(
                "cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105",
                selectedDevice === device.name
                  ? "ring-2 ring-primary bg-primary/10"
                  : "hover:bg-gray-50",
              )}
              onClick={() => {
                if (selectedDevice === "senseBox:Home") {
                  return;
                }
                handleDeviceChange(device.name);
              }}
            >
              <CardContent className="p-2 flex flex-col items-center space-y-4">
                {selectedDevice === "senseBox:Home" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClose();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <img
                  src={device.image}
                  alt={device.name}
                  className="w-24 h-24"
                />
                <h3 className="text-lg font-semibold">{device.name}</h3>
                {device.name === "senseBox:Home" &&
                  selectedDevice === "senseBox:Home" && (
                    <>
                      <Separator className="my-2" />
                      <div className="w-full max-w-xs">
                        <h4 className="text-sm font-medium mb-2">
                          Connection Type:
                        </h4>
                        <RadioGroup
                          value={selectedConnectionType}
                          onValueChange={(value) =>
                            handleConnectionTypeChange(value)
                          }
                          className="flex flex-col space-y-1"
                        >
                          {connectionTypes.map((type) => (
                            <div
                              key={type}
                              className="flex items-center space-x-2"
                            >
                              <RadioGroupItem value={type} id={type} />
                              <Label htmlFor={type} className="text-sm">
                                {type}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </>
                  )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
