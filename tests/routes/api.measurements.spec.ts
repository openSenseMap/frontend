import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AppLoadContext, type ActionFunctionArgs } from "react-router";
import { action as postMeasurementsAction } from "~/routes/api.boxes.$deviceId.data";
import { loader as statsLoader } from "~/routes/api.stats";
import { BASE_URL } from "vitest.setup";
import { csvExampleData, jsonSubmitData, byteSubmitData } from "tests/data";
import { createDevice, deleteDevice, getDevice } from "~/models/device.server";
import { registerUser } from "~/lib/user-service.server";
import { accessToken, sensor, type User } from "~/schema";
import { deleteUserByEmail } from "~/models/user.server";
import { drizzleClient } from "~/db.server";

const mockAccessToken = "valid-access-token";
const mockSensors = [
  { id: "sensor1", title: "Temperature", unit: "°C" },
  { id: "sensor2", title: "Humidity", unit: "%" },
];

const TEST_USER = {
  name: "testing measurement submit",
  email: "test@measurementsubmit.me",
  password: "some secure password",
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
  ],
};

describe("openSenseMap API Routes: /boxes", () => {
  let userId: string = "";
  let deviceId: string = "";
  let sensorIds: string[] = []
  let sensors: any[] = []

  beforeAll(async () => {

      const user = await registerUser(
        TEST_USER.name,
        TEST_USER.email,
        TEST_USER.password,
        "en_US",
      );
      userId = (user as User).id;
      const device = await createDevice(TEST_BOX, userId);
      deviceId = device.id

      const deviceWithSensors = await getDevice({ id: deviceId });
      sensorIds = deviceWithSensors?.sensors?.map((sensor: any) => sensor.id) || [];
      sensors = deviceWithSensors?.sensors?.map((sensor: any) => sensor) || []

      await drizzleClient.insert(accessToken).values({
        deviceId: deviceId,
        token: "valid-access-token",
      })

    });


    
  // ---------------------------------------------------
  // Single measurement POST /boxes/:id/:sensorId
  // ---------------------------------------------------
  // describe("single measurement POST", () => {
  //   it("should accept a single measurement via POST", async () => {
  //     console.log("test device id", deviceId)
  //     const request = new Request(
  //       `${BASE_URL}/api/boxes/${deviceId}/${sensorIds[0]}`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: mockAccessToken,
  //         },
  //         body: JSON.stringify({ value: 312.1 }),
  //       }
  //     );

  //     const response = await postMeasurementsAction({
  //       request,
  //       params: { deviceId: deviceId, sensorId: sensorIds[0] },
  //       context: {} as AppLoadContext
  //     } satisfies ActionFunctionArgs);

  //     expect(response).toBeInstanceOf(Response);
  //     expect(response.status).toBe(201);
  //     expect(await response.text()).toBe("Measurement saved in box");
  //   });

//     it("should reject with wrong access token", async () => {
//       const request = new Request(
//         `${BASE_URL}/api/boxes/${deviceId}/${mockSensors[0].id}`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: "wrongAccessToken",
//           },
//           body: JSON.stringify({ value: 312.1 }),
//         }
//       );

//       const response = await postMeasurementsAction({
//         request,
//         params: { deviceId: deviceId, sensorId: mockSensors[0].id },
//         context: {} as AppLoadContext,
//       } satisfies ActionFunctionArgs);

//       expect(response.status).toBe(401);
//       const body = await response.json();
//       expect(body.message).toBe("Device access token not valid!");
//     });

//     it("should accept a single measurement with timestamp", async () => {
//       const timestamp = new Date().toISOString();

//       const request = new Request(
//         `${BASE_URL}/api/boxes/${deviceId}/${mockSensors[1].id}`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: mockAccessToken,
//           },
//           body: JSON.stringify({ value: 123.4, createdAt: timestamp }),
//         }
//       );

//       const response = await postMeasurementsAction({
//         request,
//         params: { deviceId: deviceId, sensorId: mockSensors[1].id },
//         context: {} as AppLoadContext
//       } satisfies ActionFunctionArgs);

//       expect(response.status).toBe(201);
//       expect(await response.text()).toBe("Measurement saved in box");
//     });

//     it("should reject measurement with timestamp too far into the future", async () => {
//       const future = new Date(Date.now() + 90_000).toISOString(); // 1.5 min future

//       const request = new Request(
//         `${BASE_URL}/api/boxes/${deviceId}/${mockSensors[1].id}`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: mockAccessToken,
//           },
//           body: JSON.stringify({ value: 123.4, createdAt: future }),
//         }
//       );

//       const response = await postMeasurementsAction({
//         request,
//         params: { deviceId: deviceId, sensorId: mockSensors[1].id },
//         context: {} as AppLoadContext
//       } satisfies ActionFunctionArgs);

//       expect(response.status).toBe(422);
//     });
//   });

//   // ---------------------------------------------------
// // Multiple CSV POST
// // ---------------------------------------------------
describe("multiple CSV POST /boxes/:id/data", () => {
    it("should accept multiple measurements as CSV via POST (no timestamps)", async () => {
      const csvPayload = csvExampleData.noTimestamps(sensors);
  
      const request = new Request(
        `${BASE_URL}/api/boxes/${deviceId}/data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "text/csv",
            Authorization: mockAccessToken,
          },
          body: csvPayload,
        }
      );
  
      const response = await postMeasurementsAction({
        request,
        params: { deviceId: deviceId },
        context: {} as AppLoadContext,
      } satisfies ActionFunctionArgs);
  
      expect(response.status).toBe(201);
      expect(await response.text()).toContain("Measurements saved in box");
    });
  
    it("should accept multiple measurements as CSV via POST (with timestamps)", async () => {
      const csvPayload = csvExampleData.withTimestamps(sensors);
  
      const request = new Request(
        `${BASE_URL}/api/boxes/${deviceId}/data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "text/csv",
            Authorization: mockAccessToken,
          },
          body: csvPayload,
        }
      );
  
      const response = await postMeasurementsAction({
        request,
        params: { deviceId: deviceId },
        context: {} as AppLoadContext,
      } satisfies ActionFunctionArgs);
  
      expect(response.status).toBe(201);
    });
  
    it("should reject CSV with future timestamps", async () => {
      const csvPayload = csvExampleData.withTimestampsFuture(sensors);
      console.log("csvPayload", csvPayload)
  
      const request = new Request(
        `${BASE_URL}/api/boxes/${deviceId}/data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "text/csv",
            Authorization: mockAccessToken,
          },
          body: csvPayload,
        }
      );
  
      const response = await postMeasurementsAction({
        request,
        params: { deviceId: deviceId },
        context: {} as AppLoadContext,
      } satisfies ActionFunctionArgs);
  
      expect(response.status).toBe(422);
    });
  });
  

  // ---------------------------------------------------
  // Multiple bytes POST
  // ---------------------------------------------------
  // describe("multiple bytes POST /boxes/:id/data", () => {

  //   it("should accept multiple measurements as bytes via POST", async () => {
  //     const request = new Request(
  //       `${BASE_URL}/api/boxes/${deviceId}/data`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/sbx-bytes",
  //           Authorization: mockAccessToken,
  //         },
  //         body: byteSubmitData(sensors),
  //       }
  //     );

  //     const response = await postMeasurementsAction({
  //       request,
  //       params: { deviceId: deviceId },
  //       context: {} as AppLoadContext
  //     } as ActionFunctionArgs);

  //     expect(response.status).toBe(201);
  //     expect(await response.text()).toContain("Measurements saved in box");
  //   });

  //   it("should accept multiple measurements as bytes with timestamps", async () => {
  //     const request = new Request(
  //       `${BASE_URL}/api/boxes/${deviceId}/data`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/sbx-bytes-ts",
  //           Authorization: mockAccessToken,
  //         },
  //         body: byteSubmitData(sensors, true),
  //       }
  //     );

  //     const response = await postMeasurementsAction({
  //       request,
  //       params: { deviceId: deviceId },
  //       context: {} as AppLoadContext
  //     } as ActionFunctionArgs);

  //     expect(response.status).toBe(201);
  //   });
  // });

  // ---------------------------------------------------
  // MQTT publishing
  // ---------------------------------------------------
//   describe("MQTT submission", () => {
//     it("should accept measurements through mqtt", async () => {
//       // NOTE: You’ll need to wire up a real or mock MQTT client.
//       // Example: use `mqtt` npm package and connect to a local broker in test env.
//       // Here we just stub:

//       const fakePublishMqttMessage = async (
//         topic: string,
//         payload: string
//       ) => {
//         // call your app’s MQTT ingestion handler directly instead of broker
//         const request = new Request(`${BASE_URL}/api/mqtt`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: payload,
//         });
//         return postMeasurementsAction({
//           request,
//           params: { deviceId: deviceId },
//         } as ActionFunctionArgs);
//       };

//       const payload = JSON.stringify(jsonSubmitData.jsonArr(mockSensors));
//       const mqttResponse = await fakePublishMqttMessage("mytopic", payload);

//       expect(mqttResponse.status).toBe(201);
//     });
//   });

describe("multiple JSON POST /boxes/:id/data", () => {
  it("should accept multiple measurements with timestamps as JSON object via POST (content-type: json)", async () => {
    const submitData = jsonSubmitData.jsonObj(sensors);

    const request = new Request(
      `${BASE_URL}/api/boxes/${deviceId}/data`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: mockAccessToken,
        },
        body: JSON.stringify(submitData),
      }
    );

    const before = new Date();

    const response = await postMeasurementsAction({
      request,
      params: { deviceId },
      context: {} as AppLoadContext,
    } satisfies ActionFunctionArgs);

    const after = new Date();

    expect(response.status).toBe(201);
    expect(await response.text()).toContain("Measurements saved in box");

    // Verify sensors got updated
    const updatedDevice = await getDevice({ id: deviceId });
    for (const sensor of updatedDevice?.sensors || []) {
      expect(sensor.lastMeasurement).toBeTruthy();
      expect(new Date(sensor.lastMeasurement.createdAt).getTime())
        .toBeGreaterThanOrEqual(before.getTime() - 1000);
      expect(new Date(sensor.lastMeasurement.createdAt).getTime())
        .toBeLessThanOrEqual(after.getTime() + 1000 * 60 * 4); // within ~4 min
    }
  });

  it("should accept multiple measurements with timestamps as JSON object via POST", async () => {
    const submitData = jsonSubmitData.jsonObj(sensors);

    const request = new Request(
      `${BASE_URL}/api/boxes/${deviceId}/data`,
      {
        method: "POST",
        headers: {
          Authorization: mockAccessToken,
          // TODO: remove header here
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      }
    );

    const before = new Date();
    const response = await postMeasurementsAction({
      request,
      params: { deviceId },
      context: {} as AppLoadContext,
    } satisfies ActionFunctionArgs);
    const after = new Date();

    expect(response.status).toBe(201);
    expect(await response.text()).toContain("Measurements saved in box");

    const updatedDevice = await getDevice({ id: deviceId });
    for (const sensor of updatedDevice?.sensors || []) {
      expect(sensor.lastMeasurement).toBeTruthy();
      const createdAt = new Date(sensor.lastMeasurement.createdAt);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
      expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000 * 60 * 4);
    }
  });

  it("should accept multiple measurements with timestamps as JSON array via POST", async () => {
    const submitData = jsonSubmitData.jsonArr(sensors);

    const request = new Request(
      `${BASE_URL}/api/boxes/${deviceId}/data`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: mockAccessToken,
        },
        body: JSON.stringify(submitData),
      }
    );

    const before = new Date();
    const response = await postMeasurementsAction({
      request,
      params: { deviceId },
      context: {} as AppLoadContext,
    } satisfies ActionFunctionArgs);
    const after = new Date();

    expect(response.status).toBe(201);
    expect(await response.text()).toContain("Measurements saved in box");

    const updatedDevice = await getDevice({ id: deviceId });
    for (const sensor of updatedDevice?.sensors || []) {
      expect(sensor.lastMeasurement).toBeTruthy();
      const createdAt = new Date(sensor.lastMeasurement.createdAt);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
      expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000 * 60 * 4);
    }
  });
});


  afterAll(async () => {
      // delete the valid test user
      await deleteUserByEmail(TEST_USER.email);
      await deleteDevice({ id: deviceId });
    });
});
