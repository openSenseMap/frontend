import { type LoaderFunctionArgs } from "react-router";
import { BASE_URL } from "vitest.setup";
import { createToken } from "~/lib/jwt";
import { registerUser } from "~/lib/user-service.server";
import { createDevice, deleteDevice } from "~/models/device.server";
import { getSensors } from "~/models/sensor.server";
import { deleteUserByEmail } from "~/models/user.server";
import { loader } from "~/routes/api.boxes.$deviceId.sensors.$sensorId";
import { type Sensor, type Device, type User } from "~/schema";

const DEVICE_SENSORS_ID_USER = {
  name: "meTestSensorsIds",
  email: "test@box.sensorids",
  password: "highlySecurePasswordForTesting",
};

const DEVICE_SENSOR_ID_BOX = {
  name: `${DEVICE_SENSORS_ID_USER}s Box`,
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

describe("openSenseMap API Routes: /boxes/:deviceId/sensors/:sensorId", () => {
  let jwt: string = "";
  let device: Device;
  let deviceId: string = "";
  let sensors: Sensor[] = [];

  beforeAll(async () => {
    const user = await registerUser(
      DEVICE_SENSORS_ID_USER.name,
      DEVICE_SENSORS_ID_USER.email,
      DEVICE_SENSORS_ID_USER.password,
      "en_US",
    );
    const { token: t } = await createToken(user as User);
    jwt = t;

    device = await createDevice(DEVICE_SENSOR_ID_BOX, (user as User).id);
    deviceId = device.id;
    sensors = await getSensors(deviceId);
  });

  describe("GET", () => {
    it("should allow download data", async () => {
      // Arrange
      const request = new Request(
        `${BASE_URL}/boxes/${deviceId}/data/${sensors[0].id}`,
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
      expect(Array.isArray(body)).toBe(true);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(body.length).toBeGreaterThan(4);
      body.forEach((measurement: any) => {
        expect(new Date(measurement.createdAt).valueOf()).not.toBeNaN(); // Checks if createdAt is valid
      });
    });

    it("should allow download data as csv", async () => {
      // Arrange
      const request = new Request(
        `${BASE_URL}/boxes/${deviceId}/data/${sensors[1].id}?format=csv&download=true`,
        { method: "GET", headers: { Authorization: `Bearer ${jwt}` } },
      );

      // Act
      const dataFunctionValue = await loader({
        request,
      } as LoaderFunctionArgs);
      const response = dataFunctionValue as Response;
      const text = await response?.text();

      // Assert
      expect(response.status).toBe(200);
      expect(text).not.toBe("");
      expect(response.headers.get("content-type")).toBe("text/csv");
      expect(response.headers.get("Content-Disposition")).toBe(
        `attachment; filename=${sensors[1].id}.csv`,
      );
    });

    it("should return the data in descending order", async () => {
      // Arrange
      const request = new Request(
        `${BASE_URL}/boxes/${deviceId}/data/${sensors[1].id}?from-date=2016-01-01T00:00:00Z&to-date=2016-01-31T23:59:59Z`,
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
      // If using schema matcher: expect(body).toMatchSchema(measurementsSchema);
      body.forEach((measurement: any) => {
        expect(new Date(measurement.createdAt).valueOf()).not.toBeNaN();
      });
      expect(body.length).toBeGreaterThan(0);
      let isDescending = true;
      for (let i = 1; i < body.length; i++) {
        if (new Date(body[i - 1].createdAt) < new Date(body[i].createdAt)) {
          isDescending = false;
          break;
        }
      }
      expect(isDescending).toBe(true);
    });

    it("should allow timestamps in the future for data retrieval", async () => {
      // Arrange
      const now = new Date();
      const future1 = new Date(now);
      future1.setDate(future1.getDate() + 10);
      const future2 = new Date(future1);
      future2.setDate(future2.getDate() + 4);

      const request = new Request(
        `${BASE_URL}/boxes/${deviceId}/data/${sensors[1].id}?from-date=${future1.toISOString()}&to-date=${future2.toISOString()}`,
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
      expect(body).toEqual([]); // Array is empty
    });

    it("should allow to compute outliers in measurements and mark them", async () => {
      // Arrange
      const request = new Request(
        `${BASE_URL}/boxes/${deviceId}/data/${sensors[1].id}?outliers=mark`,
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
      expect(body.length).toBeGreaterThan(0);
      body.forEach((measurement: any) => {
        expect(measurement).toHaveProperty("isOutlier");
        expect(measurement).toHaveProperty("createdAt");
        expect(measurement).toHaveProperty("value");
        expect(measurement).toHaveProperty("location");
        expect(typeof measurement.isOutlier).toBe("boolean");
      });
    });

    it("should allow to compute outliers in measurements and replace them", async () => {
      // Arrange
      const request = new Request(
        `${BASE_URL}/boxes/${deviceId}/data/${sensors[1].id}?outliers=replace`,
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
      expect(body.length).toBeGreaterThan(0);
      body.forEach((measurement: any) => {
        expect(measurement).toHaveProperty("isOutlier");
        expect(measurement).toHaveProperty("createdAt");
        expect(measurement).toHaveProperty("value");
        expect(measurement).toHaveProperty("location");
        expect(typeof measurement.isOutlier).toBe("boolean");
      });
    });

    it("should return a single sensor of a box", async () => {
      // Arrange
      const request = new Request(
        `${BASE_URL}/boxes/${deviceId}/sensors/${sensors[0].id}`,
        { method: "GET", headers: { Authorization: `Bearer ${jwt}` } },
      );

      // Act
      const dataFunctionValue = await loader({
        request,
      } as LoaderFunctionArgs); // Assuming a separate loader for single sensor
      const response = dataFunctionValue as Response;
      const body = await response?.json();

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      // If you have a schema check: expect(body).toMatchSchema(sensorSchema);
      // For now, just expect the body has the expected shape
      expect(body).toHaveProperty("_id");
    });

    it("should return only value of a single sensor of a box", async () => {
      // Arrange
      const request = new Request(
        `${BASE_URL}/boxes/${deviceId}/sensors/${sensors[0].id}?onlyValue=true`,
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
      expect(typeof body).toBe("number");
    });
  });

  afterAll(async () => {
    // delete the valid test user
    await deleteUserByEmail(DEVICE_SENSORS_ID_USER.email);

    // delete the box
    await deleteDevice({ id: deviceId });
  });
});
