import { eq, sql } from "drizzle-orm";
import  { type AppLoadContext, type ActionFunctionArgs } from "react-router";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { BASE_URL } from "vitest.setup";
import { drizzleClient } from "~/db.server";
import { registerUser } from "~/lib/user-service.server";
import { createDevice, deleteDevice, getDevice } from "~/models/device.server";
import { deleteUserByEmail } from "~/models/user.server";
import { action as postSingleMeasurementAction } from "~/routes/api.boxes.$deviceId.$sensorId";
import { action as postMeasurementsAction} from "~/routes/api.boxes.$deviceId.data";
import { loader as getLocationsLoader } from "~/routes/api.boxes.$deviceId.locations";
import { location, deviceToLocation, measurement, type User } from "~/schema";

const mockAccessToken = "valid-access-token-location-tests";

const TEST_USER = {
  name: "testing location measurements",
  email: "test@locationmeasurement.me",
  password: "some secure password for locations",
};

const TEST_BOX = {
  name: `'${TEST_USER.name}'s Box`,
  exposure: "outdoor",
  expiresAt: null,
  tags: [],
  latitude: 0,
  longitude: 0,
  model: "luftdaten.info",
  mqttEnabled: false,
  ttnEnabled: false,
  sensors: [
    { title: "Temperature", unit: "°C", sensorType: "temperature" },
    { title: "Humidity", unit: "%", sensorType: "humidity" },
    { title: "Pressure", unit: "hPa", sensorType: "pressure" }
  ],
};

describe("openSenseMap API Routes: Location Measurements", () => {
  let userId: string = "";
  let deviceId: string = "";
  let sensorIds: string[] = [];
  let sensors: any[] = [];

  // Helper function to get device's current location
  async function getDeviceCurrentLocation(deviceId: string) {
    const deviceWithLocations = await drizzleClient.query.device.findFirst({
      where: (device, { eq }) => eq(device.id, deviceId),
      with: {
        locations: {
          orderBy: (deviceToLocation, { desc }) => [desc(deviceToLocation.time)],
          limit: 1,
          with: {
            geometry: {
              columns: {},
              extras: {
                x: sql<number>`ST_X(${location.location})`.as('x'),
                y: sql<number>`ST_Y(${location.location})`.as('y'),
              },
            },
          },
        },
      },
    });

    if (deviceWithLocations?.locations?.[0]?.geometry) {
      const geo = deviceWithLocations.locations[0].geometry;
      return {
        coordinates: [geo.x, geo.y, 0],
        time: deviceWithLocations.locations[0].time,
      };
    }
    return null;
  }

  // Helper to get all device locations
  async function getDeviceLocations(deviceId: string) {
    const result = await drizzleClient
      .select({
        timestamp: deviceToLocation.time,
        x: sql<number>`ST_X(${location.location})`,
        y: sql<number>`ST_Y(${location.location})`,
      })
      .from(deviceToLocation)
      .innerJoin(location, eq(deviceToLocation.locationId, location.id))
      .where(eq(deviceToLocation.deviceId, deviceId))
      .orderBy(deviceToLocation.time);

    return result.map(r => ({
      timestamp: r.timestamp,
      coordinates: [r.x, r.y, 0],
    }));
  }

  async function getSensorMeasurements(sensorId: string) {
    const results = await drizzleClient
      .select({
        value: measurement.value,
        time: measurement.time,
        locationId: measurement.locationId,
        x: sql<number>`ST_X(${location.location})`,
        y: sql<number>`ST_Y(${location.location})`,
      })
      .from(measurement)
      .leftJoin(location, eq(measurement.locationId, location.id))
      .where(eq(measurement.sensorId, sensorId))
      .orderBy(measurement.time);

    return results.map(r => ({
      value: String(r.value),
      time: r.time,
      location: r.x && r.y ? [r.x, r.y, 0] : null,
    }));
  }

  beforeAll(async () => {
    const user = await registerUser(
      TEST_USER.name,
      TEST_USER.email,
      TEST_USER.password,
      "en_US",
    );
    userId = (user as User).id;
    const device = await createDevice(TEST_BOX, userId);
    deviceId = device.id;

    const deviceWithSensors = await getDevice({ id: deviceId });
    sensorIds = deviceWithSensors?.sensors?.map((sensor: any) => sensor.id) || [];
    sensors = deviceWithSensors?.sensors?.map((sensor: any) => sensor) || [];
  });

  afterEach(async () => {
    await drizzleClient
      .delete(deviceToLocation)
      .where(eq(deviceToLocation.deviceId, deviceId));
  });

  afterAll(async () => {
    await deleteUserByEmail(TEST_USER.email);
    await deleteDevice({ id: deviceId });
  });

  describe("POST /boxes/:deviceId/:sensorId with locations", () => {
    it("should allow updating a box's location via new measurement (array)", async () => {
      const measurement = { 
        value: 3, 
        location: [3, 3, 3]
      };

      const request = new Request(
        `${BASE_URL}/api/boxes/${deviceId}/${sensorIds[0]}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: mockAccessToken,
          },
          body: JSON.stringify(measurement),
        }
      );

      const response: any = await postSingleMeasurementAction({
        request,
        params: { deviceId: deviceId, sensorId: sensorIds[0] },
        context: {} as AppLoadContext
      } satisfies ActionFunctionArgs);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(201);
      expect(await response.text()).toBe("Measurement saved in box");

      const currentLocation = await getDeviceCurrentLocation(deviceId);
      expect(currentLocation).not.toBeNull();
      expect(currentLocation!.coordinates[0]).toBeCloseTo(3, 5);
      expect(currentLocation!.coordinates[1]).toBeCloseTo(3, 5);
    });

    it("should allow updating a box's location via new measurement (latLng)", async () => {
      const measurement = { 
        value: 4, 
        location: { lat: 4, lng: 4, height: 4 } 
      };

      const request = new Request(
        `${BASE_URL}/api/boxes/${deviceId}/${sensorIds[0]}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: mockAccessToken,
          },
          body: JSON.stringify(measurement),
        }
      );

      const response: any = await postSingleMeasurementAction({
        request,
        params: { deviceId: deviceId, sensorId: sensorIds[0] },
        context: {} as AppLoadContext
      } satisfies ActionFunctionArgs);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(201);

      const currentLocation = await getDeviceCurrentLocation(deviceId);
      expect(currentLocation).not.toBeNull();
      expect(currentLocation!.coordinates[0]).toBeCloseTo(4, 5);
      expect(currentLocation!.coordinates[1]).toBeCloseTo(4, 5);
    });

    it("should not update box.currentLocation for an earlier timestamp", async () => {
      const currentMeasurement = {
        value: 4.1,
        location: [4, 4, 0]
      };

      let request = new Request(
        `${BASE_URL}/api/boxes/${deviceId}/${sensorIds[0]}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: mockAccessToken,
          },
          body: JSON.stringify(currentMeasurement),
        }
      );

      await postSingleMeasurementAction({
        request,
        params: { deviceId: deviceId, sensorId: sensorIds[0] },
        context: {} as AppLoadContext
      } satisfies ActionFunctionArgs);

      const locationAfterCurrent = await getDeviceCurrentLocation(deviceId);
      expect(locationAfterCurrent!.coordinates[0]).toBeCloseTo(4, 5);
      expect(locationAfterCurrent!.coordinates[1]).toBeCloseTo(4, 5);

      const pastTime = new Date(Date.now() - 60000); // 1 minute ago
      const pastMeasurement = {
        value: -1,
        location: [-1, -1, -1],
        createdAt: pastTime.toISOString(),
      };

      request = new Request(
        `${BASE_URL}/api/boxes/${deviceId}/${sensorIds[0]}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: mockAccessToken,
          },
          body: JSON.stringify(pastMeasurement),
        }
      );

      const response: any = await postSingleMeasurementAction({
        request,
        params: { deviceId: deviceId, sensorId: sensorIds[0] },
        context: {} as AppLoadContext
      } satisfies ActionFunctionArgs);

      expect(response.status).toBe(201);

      // Verify location was NOT updated (should still be [4, 4])
      const locationAfterPast = await getDeviceCurrentLocation(deviceId);
      expect(locationAfterPast!.coordinates[0]).toBeCloseTo(4, 5);
      expect(locationAfterPast!.coordinates[1]).toBeCloseTo(4, 5);
    });

    it("should predate first location for measurement with timestamp and no location", async () => {
      const testDevice = await createDevice({
        ...TEST_BOX,
        name: "Location Predate Test Box"
      }, userId);
    

      const testDeviceData = await getDevice({ id: testDevice.id });
      const testSensorId = testDeviceData?.sensors?.[0]?.id;

      const createdAt = new Date(Date.now() - 600000); // 10 minutes ago
      const measurement = { 
        value: -1, 
        createdAt: createdAt.toISOString() 
      };

      const request = new Request(
        `${BASE_URL}/api/boxes/${testDevice.id}/${testSensorId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: mockAccessToken,
          },
          body: JSON.stringify(measurement),
        }
      );

      const response: any = await postSingleMeasurementAction({
        request,
        params: { deviceId: testDevice.id, sensorId: testSensorId },
        context: {} as AppLoadContext
      } satisfies ActionFunctionArgs);

      expect(response.status).toBe(201);

      const locations = await getDeviceLocations(testDevice.id);
      expect(locations).toHaveLength(0);

      await deleteDevice({ id: testDevice.id });
    });

    it("should infer measurement.location for measurements without location", async () => {
      // Create a fresh device for this test
      const testDevice = await createDevice({
        ...TEST_BOX,
        name: "Location Inference Test Box"
      }, userId);

      const testDeviceData = await getDevice({ id: testDevice.id });
      const testSensorId = testDeviceData?.sensors?.[0]?.id;

      // First, set a location at time T-2 minutes
      const time1 = new Date(Date.now() - 120000);
      const measurement1 = {
        value: -1,
        location: [-1, -1, -1],
        createdAt: time1.toISOString()
      };

      let request = new Request(
        `${BASE_URL}/api/boxes/${testDevice.id}/${testSensorId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: mockAccessToken,
          },
          body: JSON.stringify(measurement1),
        }
      );

      await postSingleMeasurementAction({
        request,
        params: { deviceId: testDevice.id, sensorId: testSensorId },
        context: {} as AppLoadContext
      } satisfies ActionFunctionArgs);

      // Second, set a different location at time T (now)
      const time2 = new Date();
      const measurement2 = {
        value: 1,
        location: [1, 1, 1],
        createdAt: time2.toISOString()
      };

      request = new Request(
        `${BASE_URL}/api/boxes/${testDevice.id}/${testSensorId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: mockAccessToken,
          },
          body: JSON.stringify(measurement2),
        }
      );

      await postSingleMeasurementAction({
        request,
        params: { deviceId: testDevice.id, sensorId: testSensorId },
        context: {} as AppLoadContext
      } satisfies ActionFunctionArgs);

      // Now post a measurement without location at T-1 minute (between the two locations)
      const time3 = new Date(Date.now() - 60000);
      const measurement3 = {
        value: -0.5,
        createdAt: time3.toISOString()
      };

      request = new Request(
        `${BASE_URL}/api/boxes/${testDevice.id}/${testSensorId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: mockAccessToken,
          },
          body: JSON.stringify(measurement3),
        }
      );

      await postSingleMeasurementAction({
        request,
        params: { deviceId: testDevice.id, sensorId: testSensorId },
        context: {} as AppLoadContext
      } satisfies ActionFunctionArgs);

      const measurements = await getSensorMeasurements(testSensorId!);

      const m1 = measurements.find(m => m.value === '-0.5');
      expect(m1).toBeDefined();
      expect(m1!.location).not.toBeNull();
      expect(m1!.location![0]).toBeCloseTo(-1, 5); // Should have location from T-2
      expect(m1!.location![1]).toBeCloseTo(-1, 5);

      const m2 = measurements.find(m => m.value === '1');
      expect(m2).toBeDefined();
      expect(m2!.location).not.toBeNull();
      expect(m2!.location![0]).toBeCloseTo(1, 5);
      expect(m2!.location![1]).toBeCloseTo(1, 5);

      await deleteDevice({ id: testDevice.id });
    });

    it("should not update location of measurements for retroactive measurements", async () => {
      const testDevice = await createDevice({
        ...TEST_BOX,
        name: "Retroactive Measurements Test Box"
      }, userId);

      const testDeviceData = await getDevice({ id: testDevice.id });
      const testSensorId = testDeviceData?.sensors?.[0]?.id;

      // Post three measurements out of order
      const now = new Date();
      
      // First post: measurement3 at T with location [6,6,6]
      const measurement3 = {
        value: 6,
        location: [6, 6, 6],
        createdAt: now.toISOString()
      };

      let request = new Request(
        `${BASE_URL}/api/boxes/${testDevice.id}/${testSensorId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: mockAccessToken,
          },
          body: JSON.stringify(measurement3),
        }
      );

      await postSingleMeasurementAction({
        request,
        params: { deviceId: testDevice.id, sensorId: testSensorId },
        context: {} as AppLoadContext
      } satisfies ActionFunctionArgs);

      // Second post: measurement2 at T-2ms without location
      const time2 = new Date(now.getTime() - 2);
      const measurement2 = {
        value: 4.5,
        createdAt: time2.toISOString()
      };

      request = new Request(
        `${BASE_URL}/api/boxes/${testDevice.id}/${testSensorId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: mockAccessToken,
          },
          body: JSON.stringify(measurement2),
        }
      );

      await postSingleMeasurementAction({
        request,
        params: { deviceId: testDevice.id, sensorId: testSensorId },
        context: {} as AppLoadContext
      } satisfies ActionFunctionArgs);

      // Third post: measurement1 at T-4ms with location [5,5,5]
      const time1 = new Date(now.getTime() - 4);
      const measurement1 = {
        value: 5,
        location: [5, 5, 5],
        createdAt: time1.toISOString()
      };

      request = new Request(
        `${BASE_URL}/api/boxes/${testDevice.id}/${testSensorId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: mockAccessToken,
          },
          body: JSON.stringify(measurement1),
        }
      );

      await postSingleMeasurementAction({
        request,
        params: { deviceId: testDevice.id, sensorId: testSensorId },
        context: {} as AppLoadContext
      } satisfies ActionFunctionArgs);

      const measurements = await getSensorMeasurements(testSensorId!);

      // measurement2 (value 4.5) at T-2ms should have no location
      // because at the time it was posted, there was no location before T-2ms
      const m2 = measurements.find(m => m.value === '4.5');
      expect(m2).toBeDefined();
      expect(m2!.location).toBeNull();

      // measurement1 should have its explicit location
      const m1 = measurements.find(m => m.value === '5');
      expect(m1).toBeDefined();
      expect(m1!.location).not.toBeNull();
      expect(m1!.location![0]).toBeCloseTo(5, 5);
      expect(m1!.location![1]).toBeCloseTo(5, 5);

      // measurement3 should have its explicit location
      const m3 = measurements.find(m => m.value === '6');
      expect(m3).toBeDefined();
      expect(m3!.location).not.toBeNull();
      expect(m3!.location![0]).toBeCloseTo(6, 5);
      expect(m3!.location![1]).toBeCloseTo(6, 5);

      await deleteDevice({ id: testDevice.id });
    });

    it("should reject invalid location coordinates (longitude out of range)", async () => {
      const measurement = { 
        value: 100, 
        location: [200, 50, 0]
      };

      const request = new Request(
        `${BASE_URL}/api/boxes/${deviceId}/${sensorIds[0]}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: mockAccessToken,
          },
          body: JSON.stringify(measurement),
        }
      );

      const response: any = await postSingleMeasurementAction({
        request,
        params: { deviceId: deviceId, sensorId: sensorIds[0] },
        context: {} as AppLoadContext
      } satisfies ActionFunctionArgs);

      expect(response.status).toBe(422);
      const errorData = await response.json();
      expect(errorData.code).toBe("Unprocessable Entity");
      expect(errorData.message).toBe("Invalid location coordinates");
    });

    it("should reject invalid location coordinates (latitude out of range)", async () => {
      const measurement = { 
        value: 101, 
        location: [50, 100, 0]
      };

      const request = new Request(
        `${BASE_URL}/api/boxes/${deviceId}/${sensorIds[0]}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: mockAccessToken,
          },
          body: JSON.stringify(measurement),
        }
      );

      const response: any = await postSingleMeasurementAction({
        request,
        params: { deviceId: deviceId, sensorId: sensorIds[0] },
        context: {} as AppLoadContext
      } satisfies ActionFunctionArgs);

      expect(response.status).toBe(422);
      const errorData = await response.json();
      expect(errorData.code).toBe("Unprocessable Entity");
      expect(errorData.message).toBe("Invalid location coordinates");
    });
  });

  describe("openSenseMap API Routes: POST /boxes/:deviceId/data (application/json)", () => {  
  
    it("should accept location in measurement object with [value, time, loc]", async () => {
      const now = new Date();
      const body = {
        [sensorIds[0]]: [7, new Date(now.getTime() - 2).toISOString(), [7, 7, 7]],
        [sensorIds[1]]: [8, now.toISOString(), { lat: 8, lng: 8, height: 8 }],
      };  
      const request = new Request(`${BASE_URL}/api/boxes/${deviceId}/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: mockAccessToken,
        },
        body: JSON.stringify(body),
      });
  
      const response: any = await postMeasurementsAction({
        request,
        params: { deviceId },
        context: {} as AppLoadContext,
      } satisfies ActionFunctionArgs);
  
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(201);
  
      const currentLocation = await getDeviceCurrentLocation(deviceId);
      expect(currentLocation).not.toBeNull();
      expect(currentLocation!.coordinates).toEqual([8, 8, 0]);
    });
  
    it("should accept location in measurement array", async () => {
      const sensor = sensorIds[2];
      const measurements = [
        { sensor: sensor, value: 9.6 },
        { sensor: sensor, value: 10, location: { lat: 10, lng: 10, height: 10 } },
        { sensor: sensor, value: 9.5, createdAt: new Date().toISOString() },
        {
          sensor: sensor,
          value: 9,
          createdAt: new Date(Date.now() - 2).toISOString(),
          location: [9, 9, 9],
        },
        { sensor: sensor, value: 10.5 },
      ];
  
      const request = new Request(`${BASE_URL}/api/boxes/${deviceId}/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: mockAccessToken,
        },
        body: JSON.stringify(measurements),
      });
  
      const response: any = await postMeasurementsAction({
        request,
        params: { deviceId },
        context: {} as AppLoadContext,
      } satisfies ActionFunctionArgs);
  
      expect(response.status).toBe(201);
  
      const currentLocation = await getDeviceCurrentLocation(deviceId);
      expect(currentLocation).not.toBeNull();
      expect(currentLocation!.coordinates).toEqual([10, 10, 0]);
    });
  
    it("should set & infer locations correctly for measurements", async () => {
      const sensor = sensorIds[2];
      const measurements = await getSensorMeasurements(sensor);
      
      expect(measurements.length).toBeGreaterThanOrEqual(5);
  
      for (const m of measurements) {
        // For this dataset, value should roghly match coordinate
        const v = parseInt(m.value, 10);
        if (m.location) {
          expect(m.location).toEqual([v, v, 0]);
        }
      }
    });
  });

  describe("GET /boxes/:deviceId/locations", () => {
    it("should return all locations of a box sorted by date", async () => {

      
      const sensorId = sensorIds[0];
  
      const points = [
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3],
      ];
  
      for (const [lng, lat] of points) {
        const measurement = {
          value: 10,
          location: [lng, lat, 0],
          createdAt: new Date(Date.now() + lng * 1000).toISOString(), // increasing timestamps
        };
  
        const req = new Request(`${BASE_URL}/api/boxes/${deviceId}/${sensorId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: mockAccessToken,
          },
          body: JSON.stringify(measurement),
        });
  
        await postSingleMeasurementAction({
          request: req,
          params: { deviceId, sensorId },
          context: {} as AppLoadContext,
        });
      }
  
      const request = new Request(`${BASE_URL}/api/boxes/${deviceId}/locations`);
      const response: any = await getLocationsLoader({
        request,
        params: { deviceId },
        context: {} as AppLoadContext,
      });
  
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
  
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(points.length);
  
      // Ensure sorted ascending by timestamp
      let prevTime = new Date(0);
      for (const loc of data) {
        expect(loc).toHaveProperty("type", "Point");
        expect(Array.isArray(loc.coordinates)).toBe(true);
        expect(typeof loc.timestamp).toBe("string");
        const t = new Date(loc.timestamp);
        expect(t.getTime()).toBeGreaterThan(prevTime.getTime());
        prevTime = t;
      }
  
      // Ensure coordinates match inserted ones
      const coords = data.map((d: any) => d.coordinates.map(Math.round));
      expect(coords).toEqual(points.map(([lng, lat]) => [lng, lat, 0]));
    });
  
    it("should return all locations of a box as GeoJSON LineString", async () => {
      const request = new Request(
        `${BASE_URL}/api/boxes/${deviceId}/locations?format=geojson`
      );
      const response: any = await getLocationsLoader({
        request,
        params: { deviceId },
        context: {} as AppLoadContext,
      });
  
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
  
      const geojson = await response.json();
      expect(geojson).toHaveProperty("type", "Feature");
      expect(geojson).toHaveProperty("geometry");
      expect(geojson.geometry.type).toBe("LineString");
      expect(Array.isArray(geojson.geometry.coordinates)).toBe(true);
      expect(Array.isArray(geojson.properties.timestamps)).toBe(true);
      expect(geojson.geometry.coordinates.length).toBe(
        geojson.properties.timestamps.length
      );
    });
  
    it("should return locations of the last 48h by default", async () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  
      const sensorId = sensorIds[0];
  
      // Add 2 locations: one inside 48h, one outside (6 days ago)
      const measurements = [
        { value: 11, location: [-3, -3, -3], createdAt: threeDaysAgo.toISOString() },
        { value: 12, location: [-4, -4, -4], createdAt: sixDaysAgo.toISOString() },
      ];
  
      for (const m of measurements) {
        const req = new Request(`${BASE_URL}/api/boxes/${deviceId}/${sensorId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: mockAccessToken,
          },
          body: JSON.stringify(m),
        });
        await postSingleMeasurementAction({
          request: req,
          params: { deviceId, sensorId },
          context: {} as AppLoadContext,
        });
      }
  
      const request = new Request(`${BASE_URL}/api/boxes/${deviceId}/locations`);
      const response: any = await getLocationsLoader({
        request,
        params: { deviceId },
        context: {} as AppLoadContext,
      });
  
      expect(response.status).toBe(200);
      const data = await response.json();
  
      const nowMinus48h = new Date(Date.now() - 48 * 60 * 60 * 1000);
      for (const loc of data) {
        const ts = new Date(loc.timestamp);
        expect(ts >= nowMinus48h).toBe(true);
      }
    });
  
    it("should allow filtering locations by date params", async () => {
      const toDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const request = new Request(
        `${BASE_URL}/api/boxes/${deviceId}/locations?to-date=${toDate.toISOString()}`
      );
  
      const response: any = await getLocationsLoader({
        request,
        params: { deviceId },
        context: {} as AppLoadContext,
      });
  
      expect(response.status).toBe(200);
      const data = await response.json();
  
      for (const loc of data) {
        const ts = new Date(loc.timestamp);
        expect(ts <= toDate).toBe(true);
      }
    });
  });
});