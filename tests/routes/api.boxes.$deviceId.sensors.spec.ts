import { type Params, type LoaderFunctionArgs } from "react-router";
import { BASE_URL } from "vitest.setup";
import { registerUser } from "~/lib/user-service.server";
import { createDevice, deleteDevice } from "~/models/device.server";
import { deleteUserByEmail } from "~/models/user.server";
import { loader } from "~/routes/api.boxes.$deviceId.sensors";
import { type User } from "~/schema";

const DEVICE_SENSORS_USER = {
  name: "meTestSensors",
  email: "test@box.sensors",
  password: "highlySecurePasswordForTesting",
};

const DEVICE_SENSOR_BOX = {
  name: `${DEVICE_SENSORS_USER}s Box`,
  exposure: "outdoor",
  expiresAt: null,
  tags: [],
  latitude: 0,
  longitude: 0,
  model: "luftdaten.info",
  mqttEnabled: false,
  ttnEnabled: false,
  sensors: [
    {
      title: "Temp",
      unit: "°C",
      sensorType: "dummy",
    },
    {
      title: "CO2",
      unit: "mol/L",
      sensorType: "dummy",
    },
    {
      title: "Air Pressure",
      unit: "kPa",
      sensorType: "dummy",
    },
  ],
};

describe("openSenseMap API Routes: /boxes/:deviceId/sensors", () => {
  let deviceId: string = "";

  beforeAll(async () => {
    const user = await registerUser(
      DEVICE_SENSORS_USER.name,
      DEVICE_SENSORS_USER.email,
      DEVICE_SENSORS_USER.password,
      "en_US",
    );

    const device = await createDevice(DEVICE_SENSOR_BOX, (user as User).id);
    deviceId = device.id;
  });

  describe("GET", () => {
    it("should return all sensors of a box/ device", async () => {
      // Arrange
      const request = new Request(`${BASE_URL}/boxes/${deviceId}/sensors`, {
        method: "GET",
      });

      // Act
      const dataFunctionValue = await loader({
        request,
        params: { deviceId: `${deviceId}` } as Params<string>,
      } as LoaderFunctionArgs);
      const response = dataFunctionValue as Response;
      const body = await response?.json();

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(body).toHaveProperty("sensors");
    });

    it("should return all sensors of a box with a maximum of 3 measurements when ?count=3 is used", async () => {
      // Arrange
      const request = new Request(
        `${BASE_URL}/boxes/${deviceId}/sensors?count=3`,
        { method: "GET" },
      );

      // Act
      const dataFunctionValue = await loader({
        request,
        params: { deviceId: `${deviceId}` } as Params<string>,
      } as LoaderFunctionArgs);
      const response = dataFunctionValue as Response;
      const body = await response?.json();

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(body.sensors[0].lastMeasurements).toBeDefined();
      expect(body.sensors[0].lastMeasurements).not.toBeNull();

      if (body.sensors[0].lastMeasurements.length > 0)
        expect(
          body.sensors[0].lastMeasurements.measurements.length,
        ).toBeGreaterThanOrEqual(3);
    });
  });

  afterAll(async () => {
    // delete the valid test user
    await deleteUserByEmail(DEVICE_SENSORS_USER.email);

    // delete the box
    await deleteDevice({ id: deviceId });
  });
});
