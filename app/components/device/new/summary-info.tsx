import { useFormContext } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Tag, Smartphone, Cpu, Cog } from "lucide-react";

export function SummaryInfo() {
  const { getValues } = useFormContext();
  const formData = getValues();

  const sections = [
    {
      title: "General Info",
      icon: <Tag className="w-5 h-5" />,
      data: [
        { label: "Name", value: formData.name },
        { label: "Exposure", value: formData.exposure },
        {
          label: "Tags",
          value:
            formData.tags?.map((tag: any) => tag.value).join(", ") || "None",
        },
      ],
    },
    {
      title: "Location",
      icon: <MapPin className="w-5 h-5" />,
      data: [
        { label: "Latitude", value: parseFloat(formData.latitude).toFixed(4) },
        { label: "Longitude", value: parseFloat(formData.longitude).toFixed(4) },
      ],
    },
    {
      title: "Device",
      icon: <Smartphone className="w-5 h-5" />,
      data: [{ label: "Model", value: formData.model }],
    },
    {
      title: "Sensors",
      icon: <Cpu className="w-5 h-5" />,
      data:
        formData.selectedSensors?.map((sensor: any) => ({
            value: sensor.sensorType,
            label: sensor.title,
        })) || [],
    },
    {
      title: "Advanced",
      icon: <Cog className="w-5 h-5" />,
      data: [
        { label: "MQTT Enabled", value: formData.mqttEnabled ? "Yes" : "No" },
        { label: "TTN Enabled", value: formData.ttnEnabled ? "Yes" : "No" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 flex items-center space-x-2">
                {section.icon}
                <h4 className="text-lg font-semibold text-white">
                  {section.title}
                </h4>
              </div>
              <div className="p-4 space-y-2">
                {section.data.map((item: any, idx: any) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{item.label}:</span>
                    <Badge variant="secondary" className="font-mono">
                      {item.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
