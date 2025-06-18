import { type LoaderFunctionArgs } from "react-router";
import { BASE_URL } from "vitest.setup";
import { createToken } from "~/lib/jwt";
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
};

describe("openSenseMap API Routes: /boxes/:deviceId/sensors", () => {
  let jwt: string = "";
  let deviceId: string = "";

  beforeAll(async () => {
    const user = await registerUser(
      DEVICE_SENSORS_USER.name,
      DEVICE_SENSORS_USER.email,
      DEVICE_SENSORS_USER.password,
      "en_US",
    );
    const { token: t } = await createToken(user as User);
    jwt = t;

    const device = await createDevice(DEVICE_SENSOR_BOX, (user as User).id);
    deviceId = device.id;
  });

  describe("GET", () => {
    it("should return all sensors of a box/ device", async () => {
      // Arrange
      const request = new Request(`${BASE_URL}/boxes/${deviceId}/sensors`, {
        method: "GET",
        headers: { Authorization: `Bearer ${jwt}` },
      });

      // Act
      const dataFunctionValue = await loader({
        request,
      } as LoaderFunctionArgs);
      const response = dataFunctionValue as Response;
      const body = await response?.json();

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      // If you have a schema check, you can use a matcher like:
      // expect(body).toMatchSchema(boxSensorsSchema); // You may need to use a custom matcher
      // For now, just expect the body has the expected shape
      expect(body).toHaveProperty("sensors");
    });

    it("should return all sensors of a box with a maximum of 3 measurements when ?count= is used", async () => {
      // Arrange
      const request = new Request(
        `${BASE_URL}/boxes/${deviceId}/sensors?count=3`,
        { method: "GET", headers: { Authorization: `Bearer ${jwt}` } },
      );

      // Act
      const dataFunctionValue = await loader({
        request,
      } as LoaderFunctionArgs);
      const response = dataFunctionValue as Response;
      const body = await response?.json();

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(body.sensors[0].lastMeasurements.measurements).toHaveLength(3);
    });
  });

  afterAll(async () => {
    // delete the valid test user
    await deleteUserByEmail(DEVICE_SENSORS_USER.email);

    // delete the box
    await deleteDevice({ id: deviceId });
  });
});
