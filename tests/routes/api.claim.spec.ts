import { type ActionFunctionArgs } from "react-router";
import { BASE_URL } from "vitest.setup";
import { createToken } from "~/lib/jwt";
import { registerUser } from "~/lib/user-service.server";
import { type Device, type User } from "~/schema";
import { createDevice } from "~/models/device.server";
import { getDevice } from "~/models/device.server";
import { action as transferAction } from "~/routes/api.transfer";
import { action as claimAction } from "~/routes/api.claim";
import { deleteUserByEmail } from "~/models/user.server";

const CLAIM_TEST_USER = {
  name: "claimtestuser" + Date.now(),
  email: `claimtest${Date.now()}@test.com`,
  password: "highlySecurePasswordForTesting",
};

const createTestUser = async (suffix: string): Promise<User> => {
    const result = await registerUser(
        "testuser" + suffix,
        `test${suffix}@test.com`,
        "password123",
        "en_US"
    );

    if (!result || (typeof result === 'object' && 'isValid' in result)) {
        throw new Error("Failed to create test user");
    }

    return result as User;
};

const generateMinimalDevice = (
  location: number[] | {} = [123, 12, 34],
  exposure = "mobile",
  name = "" + new Date().getTime()
) => ({
  exposure,
  location,
  name,
  model: "homeV2Ethernet",
});

describe("openSenseMap API Routes: /boxes/claim", () => {
  let user: User | null = null;
  let jwt: string = "";
  let queryableDevice: Device | null = null;

  beforeAll(async () => {
    const testUser = await registerUser(
      CLAIM_TEST_USER.name,
      CLAIM_TEST_USER.email,
      CLAIM_TEST_USER.password,
      "en_US"
    );
    user = testUser as User;
    const { token: t } = await createToken(testUser as User);
    jwt = t;

    queryableDevice = await createDevice(
      { ...generateMinimalDevice(), latitude: 123, longitude: 12 },
      (testUser as User).id
    );
  });

  afterAll(async () => {
    await deleteUserByEmail(CLAIM_TEST_USER.email);
  });

  describe("POST /boxes/claim", () => {
    it("should claim a device and transfer ownership from one user to another", async () => {
      // Create a new transfer for the claim test
      const createTransferRequest = new Request(`${BASE_URL}/boxes/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${jwt}`,
        },
        body: new URLSearchParams({ boxId: queryableDevice!.id }),
      });

      const transferResponse = (await transferAction({
        request: createTransferRequest,
      } as ActionFunctionArgs)) as Response;

      const transferBody = await transferResponse.json();
      const claimToken = transferBody.data.token;

      const newUser = await createTestUser(Date.now().toString());
      const { token: newUserJwt } = await createToken(newUser);

      // Claim the device
      const claimRequest = new Request(`${BASE_URL}/boxes/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newUserJwt}`,
        },
        body: JSON.stringify({ token: claimToken }),
      });

      const claimResponse = (await claimAction({
        request: claimRequest,
      } as ActionFunctionArgs)) as Response;

      expect(claimResponse.status).toBe(200);
      const claimBody = await claimResponse.json();
      expect(claimBody.message).toBe("Device successfully claimed!");
      expect(claimBody.data.boxId).toBe(queryableDevice!.id);

      // Verify the device is now owned by the new user
      const updatedDevice = await getDevice({ id: queryableDevice!.id });
      expect(updatedDevice?.user.id).toBe(newUser.id);

      // Verify the transfer token is deleted (can't be used again)
      const reusedClaimRequest = new Request(`${BASE_URL}/boxes/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newUserJwt}`,
        },
        body: JSON.stringify({ token: claimToken }),
      });

      const reusedResponse = (await claimAction({
        request: reusedClaimRequest,
      } as ActionFunctionArgs)) as Response;

      expect(reusedResponse.status).toBe(410);

      // Cleanup
      await deleteUserByEmail((newUser as User).email);
    });

    it("should reject claim with invalid content-type", async () => {
      // Create a fresh device for this test
      const testDevice = await createDevice(
        { ...generateMinimalDevice(), latitude: 456, longitude: 78 },
        (user as User).id
      );

      // Create a transfer for this test
      const createTransferRequest = new Request(`${BASE_URL}/boxes/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${jwt}`,
        },
        body: new URLSearchParams({ boxId: testDevice!.id }),
      });

      const transferResponse = (await transferAction({
        request: createTransferRequest,
      } as ActionFunctionArgs)) as Response;

      expect(transferResponse.status).toBe(201);
      const transferBody = await transferResponse.json();
      expect(transferBody.data).toBeDefined();
      const claimToken = transferBody.data.token;

      const claimRequest = new Request(`${BASE_URL}/boxes/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${jwt}`,
        },
        body: new URLSearchParams({ token: claimToken }),
      });

      const claimResponse = (await claimAction({
        request: claimRequest,
      } as ActionFunctionArgs)) as Response;

      expect(claimResponse.status).toBe(415);
      const body = await claimResponse.json();
      expect(body.code).toBe("NotAuthorized");
      expect(body.message).toContain("application/json");
    });

    it("should reject claim without Authorization header", async () => {
      // Create a fresh device for this test
      const testDevice = await createDevice(
        { ...generateMinimalDevice(), latitude: 789, longitude: 101 },
        (user as User).id
      );

      // Create a transfer for this test
      const createTransferRequest = new Request(`${BASE_URL}/boxes/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${jwt}`,
        },
        body: new URLSearchParams({ boxId: testDevice!.id }),
      });

      const transferResponse = (await transferAction({
        request: createTransferRequest,
      } as ActionFunctionArgs)) as Response;

      expect(transferResponse.status).toBe(201);
      const transferBody = await transferResponse.json();
      expect(transferBody.data).toBeDefined();
      const claimToken = transferBody.data.token;

      const claimRequest = new Request(`${BASE_URL}/boxes/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: claimToken }),
      });

      const claimResponse = (await claimAction({
        request: claimRequest,
      } as ActionFunctionArgs)) as Response;

      expect(claimResponse.status).toBe(403);
      const body = await claimResponse.json();
      expect(body.code).toBe("Forbidden");
    });

    it("should reject claim with expired transfer token", async () => {
      // Create a new user to attempt the claim
      const newUser = await registerUser(
        "claimer" + Date.now(),
        `claimer${Date.now()}@test.com`,
        "password123",
        "en_US"
      );
      const { token: newUserJwt } = await createToken(newUser as User);

      const claimRequest = new Request(`${BASE_URL}/boxes/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newUserJwt}`,
        },
        body: JSON.stringify({ token: "invalid-or-expired-token" }),
      });

      const claimResponse = (await claimAction({
        request: claimRequest,
      } as ActionFunctionArgs)) as Response;

      expect(claimResponse.status).toBe(410);
      const body = await claimResponse.json();
      expect(body.error).toContain("expired");

      // Cleanup
      await deleteUserByEmail((newUser as User).email);
    });

    it("should reject if user already owns the device", async () => {
      // Create a fresh device for this test
      const testDevice = await createDevice(
        { ...generateMinimalDevice(), latitude: 111, longitude: 222 },
        (user as User).id
      );

      // Create a transfer for this test
      const createTransferRequest = new Request(`${BASE_URL}/boxes/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${jwt}`,
        },
        body: new URLSearchParams({ boxId: testDevice!.id }),
      });

      const transferResponse = (await transferAction({
        request: createTransferRequest,
      } as ActionFunctionArgs)) as Response;

      expect(transferResponse.status).toBe(201);
      const transferBody = await transferResponse.json();
      expect(transferBody.data).toBeDefined();
      const claimToken = transferBody.data.token;

      // Try to claim with the original owner's JWT
      const claimRequest = new Request(`${BASE_URL}/boxes/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ token: claimToken }),
      });

      const claimResponse = (await claimAction({
        request: claimRequest,
      } as ActionFunctionArgs)) as Response;

      expect(claimResponse.status).toBe(400);
      const body = await claimResponse.json();
      expect(body.error).toContain("already own");
    });
  });
});