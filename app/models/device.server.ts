import type { Integration } from "./integration.server";
import type { Location } from "./location.server";
import type { Sensor } from "./sensor.server";

export type Device = {
  _id: string;
  name: string;
  exposure: "unknow" | "mobile" | "indoor" | "outdoor";
  model: "custom" | "homeV2Lora" | "homeV2Ethernet" | "homeV2Wifi" | "homeEthernet" | "homeWifi" | "homeEthernetFeinstaub" | "homeWifiFeinstaub" | "luftdaten_sds011" | "luftdaten_sds011_dht11" | "luftdaten_sds011_dht22" | "luftdaten_sds011_bmp180" | "luftdaten_sds011_bme280" | "hackair_home_v2";
  grouptag?: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  sensors: Sensor[];
  lastMeasurementAt?: Date;
  integrations?: Integration[];
  access_token: string;
  useAuth: boolean;
  weblink?: string;
  image?: string;
  locations: Location[];
  currentLocation: Location;
};