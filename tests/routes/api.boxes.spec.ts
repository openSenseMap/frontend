import type { ActionFunctionArgs } from "react-router";
import { BASE_URL } from "vitest.setup";
import { createToken } from "~/lib/jwt";
import { registerUser } from "~/lib/user-service.server";
import { deleteDevice } from "~/models/device.server";
import { deleteUserByEmail } from "~/models/user.server";
import { action } from "~/routes/api.boxes";
import type { User } from "~/schema";

const BOXES_POST_TEST_USER = {
  name: "testing post boxes",
  email: "test@postboxes.me",
  password: "some secure password",
};

describe("openSenseMap API Routes: /boxes", () => {
  let user: User | null = null;
  let jwt: string = "";
  let createdDeviceIds: string[] = [];

  beforeAll(async () => {
    const testUser = await registerUser(
      BOXES_POST_TEST_USER.name,
      BOXES_POST_TEST_USER.email,
      BOXES_POST_TEST_USER.password,
      "en_US",
    );
    user = testUser as User;
    const { token } = await createToken(testUser as User);
    jwt = token;
  });

  afterAll(async () => {
    for (const deviceId of createdDeviceIds) {
      try {
        await deleteDevice({ id: deviceId });
      } catch (error) {
        console.error(`Failed to delete device ${deviceId}:`, error);
      }
    }
    if (user) {
      await deleteUserByEmail(BOXES_POST_TEST_USER.email);
    }
  });

  describe("POST", () => {
    it("should create a new box with sensors", async () => {
      const requestBody = {
        name: "Test Weather Station",
        location: [7.596, 51.969],
        exposure: "outdoor",
        model: "homeV2Wifi",
        grouptag: ["weather", "test"],
        sensors: [
          {
            id: "0",
            title: "Temperature",
            unit: "°C",
            sensorType: "HDC1080",
          },
          {
            id: "1",
            title: "Humidity",
            unit: "%",
            sensorType: "HDC1080",
          },
        ],
      };

      const request = new Request(`${BASE_URL}/boxes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const response = (await action({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      if (body._id) {
        createdDeviceIds.push(body._id);
      }

      expect(response.status).toBe(201);
      expect(body).toHaveProperty("_id");
      expect(body).toHaveProperty("name", "Test Weather Station");
      expect(body).toHaveProperty("sensors");
      expect(body.sensors).toHaveLength(2);
      expect(body.sensors[0]).toHaveProperty("title", "Temperature");
      expect(body.sensors[1]).toHaveProperty("title", "Humidity");
    });

    it("should create a box with minimal data (no sensors)", async () => {
      const requestBody = {
        name: "Minimal Test Box",
        location: [7.5, 51.9],
      };

      const request = new Request(`${BASE_URL}/boxes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const response = (await action({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      if (body._id) {
        createdDeviceIds.push(body._id);
      }

      expect(response.status).toBe(201);
      expect(body).toHaveProperty("_id");
      expect(body).toHaveProperty("name", "Minimal Test Box");
      expect(body).toHaveProperty("sensors");
      expect(Array.isArray(body.sensors)).toBe(true);
      expect(body.sensors).toHaveLength(0);
    });

    it("should reject creation without authentication", async () => {
      const requestBody = {
        name: "Unauthorized Box",
        location: [7.5, 51.9],
      };

      const request = new Request(`${BASE_URL}/boxes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const response = (await action({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body).toHaveProperty("code", "Forbidden");
      expect(body).toHaveProperty("message");
    });

    it("should reject creation with invalid JWT", async () => {
      const requestBody = {
        name: "Invalid JWT Box",
        location: [7.5, 51.9],
      };

      const request = new Request(`${BASE_URL}/boxes`, {
        method: "POST",
        headers: {
          Authorization: "Bearer invalid_jwt_token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const response = (await action({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body).toHaveProperty("code", "Forbidden");
    });

    it("should reject creation with missing required fields", async () => {
      const requestBody = {
        location: [7.5, 51.9],
      };

      const request = new Request(`${BASE_URL}/boxes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const response = (await action({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("code", "Bad Request");
      expect(body).toHaveProperty("errors");
      expect(Array.isArray(body.errors)).toBe(true);
    });

    it("should reject creation with invalid location format", async () => {
      const requestBody = {
        name: "Invalid Location Box",
        location: [7.5],
      };

      const request = new Request(`${BASE_URL}/boxes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const response = (await action({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("code", "Bad Request");
      expect(body).toHaveProperty("errors");
    });

    it("should reject creation with invalid JSON", async () => {
      const request = new Request(`${BASE_URL}/boxes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: "invalid json {",
      });

      const response = (await action({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty("code", "Bad Request");
      expect(body).toHaveProperty("message", "Invalid JSON in request body");
    });

    it("should create box with default values for optional fields", async () => {
      const requestBody = {
        name: "Default Values Box",
        location: [7.5, 51.9],
      };

      const request = new Request(`${BASE_URL}/boxes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const response = (await action({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      if (body._id) {
        createdDeviceIds.push(body._id);
      }

      expect(response.status).toBe(201);
      expect(body).toHaveProperty("exposure", "unknown");
      expect(body).toHaveProperty("model", "Custom");
      expect(body).toHaveProperty("grouptag");
      expect(body.grouptag).toEqual([]);
    });
  });
});
