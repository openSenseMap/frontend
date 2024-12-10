import { useFormContext } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";

export function AdvancedStep() {
  const { register, setValue, watch, resetField } = useFormContext();

  // Watch field states
  const isMqttEnabled = watch("mqttEnabled") || false;
  const isTtnEnabled = watch("ttnEnabled") || false;

  // Clear corresponding fields when disabling
  const handleMqttToggle = (checked: boolean) => {
    setValue("mqttEnabled", checked);
    if (!checked) {
      resetField("url");
      resetField("topic");
      resetField("messageFormat");
      resetField("decodeOptions");
      resetField("connectionOptions");
    }
  };

  const handleTtnToggle = (checked: boolean) => {
    setValue("ttnEnabled", checked);
    if (!checked) {
      resetField("dev_id");
      resetField("app_id");
      resetField("profile");
      resetField("decodeOptions");
      resetField("port");
    }
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setValue(name, value);
  };

  const handleSelectChange = (field: string, value: string) => {
    setValue(field, value);
  };

  return (
    <>
      {/* MQTT Configuration */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>MQTT Configuration</CardTitle>
          <CardDescription>
            Configure your MQTT settings for data streaming
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="mqttEnabled" className="text-base font-semibold">
              Enable MQTT
            </Label>
            <Switch
              disabled
              id="mqttEnabled"
              checked={isMqttEnabled}
              onCheckedChange={handleMqttToggle}
            />
          </div>

          {isMqttEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mqtt-url">MQTT URL</Label>
                <Input
                  id="mqtt-url"
                  placeholder="mqtt://example.com:1883"
                  {...register("url")}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mqtt-topic">MQTT Topic</Label>
                <Input
                  id="mqtt-topic"
                  placeholder="my/mqtt/topic"
                  {...register("topic")}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mqtt-message-format">Message Format</Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("messageFormat", value)
                  }
                  defaultValue={watch("messageFormat")}
                >
                  <SelectTrigger id="mqtt-message-format">
                    <SelectValue placeholder="Select a message format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mqtt-decode-options">Decode Options</Label>
                <Textarea
                  id="mqtt-decode-options"
                  placeholder="Enter decode options as JSON"
                  className="resize-none"
                  {...register("decodeOptions")}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mqtt-connection-options">
                  Connection Options
                </Label>
                <Textarea
                  id="mqtt-connection-options"
                  placeholder="Enter connection options as JSON"
                  className="resize-none"
                  {...register("connectionOptions")}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TTN Configuration */}
      <Card className="w-full mt-6">
        <CardHeader>
          <CardTitle>TTN Configuration</CardTitle>
          <CardDescription>
            Configure your TTN (The Things Network) settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="ttnEnabled" className="text-base font-semibold">
              Enable TTN
            </Label>
            <Switch
              disabled
              id="ttnEnabled"
              checked={isTtnEnabled}
              onCheckedChange={handleTtnToggle}
            />
          </div>

          {isTtnEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ttn-dev-id">Device ID</Label>
                <Input
                  id="ttn-dev-id"
                  placeholder="Enter TTN Device ID"
                  {...register("dev_id")}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ttn-app-id">Application ID</Label>
                <Input
                  id="ttn-app-id"
                  placeholder="Enter TTN Application ID"
                  {...register("app_id")}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ttn-profile">Profile</Label>
                <Select
                  onValueChange={(value) =>
                    handleSelectChange("profile", value)
                  }
                  defaultValue={watch("profile")}
                >
                  <SelectTrigger id="ttn-profile">
                    <SelectValue placeholder="Select a profile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lora-serialization">
                      Lora Serialization
                    </SelectItem>
                    <SelectItem value="sensebox/home">Sensebox/Home</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="cayenne-lpp">Cayenne LPP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ttn-decode-options">Decode Options</Label>
                <Textarea
                  id="ttn-decode-options"
                  placeholder="Enter decode options as JSON"
                  className="resize-none"
                  {...register("decodeOptions")}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ttn-port">Port</Label>
                <Input
                  id="ttn-port"
                  placeholder="Enter TTN Port"
                  type="number"
                  {...register("port", { valueAsNumber: true })}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
