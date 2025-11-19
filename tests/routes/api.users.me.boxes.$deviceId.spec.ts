import { type Params, type LoaderFunctionArgs } from "react-router";
import { BASE_URL } from "vitest.setup";
import { createToken } from "~/lib/jwt";
import { registerUser } from "~/lib/user-service.server";
import { createDevice } from "~/models/device.server";
import { deleteUserByEmail } from "~/models/user.server";
import { loader } from "~/routes/api.users.me.boxes.$deviceId";
import { device, type User } from "~/schema";

const BOX_TEST_USER = {
  name: "testing my individual box",
  email: "testing@box.me",
  password: "some secure password",
};
const BOX_TEST_USER_BOX = {
  name: `${BOX_TEST_USER}s Box`,
  exposure: "outdoor",
  expiresAt: null,
  tags: [],
  latitude: 0,
  longitude: 0,
  model: "luftdaten.info",
  mqttEnabled: false,
  ttnEnabled: false,
};

const OTHER_TEST_USER = {
  name: "dont steal my box",
  email: "stealing@boxes.me",
  password: "some secure password",
};

// TODO Give the users some boxes to test with

describe("openSenseMap API Routes: /users", () => {
  describe("/me/boxes/:deviceId", () => {
    describe("GET", async () => {
      let jwt: string = "";
      let otherJwt: string = "";
      let deviceId: string = "";

      beforeAll(async () => {
        const user = await registerUser(
          BOX_TEST_USER.name,
          BOX_TEST_USER.email,
          BOX_TEST_USER.password,
          "en_US",
        );
        const { token: t } = await createToken(user as User);
        jwt = t;

        const otherUser = await registerUser(
          OTHER_TEST_USER.name,
          OTHER_TEST_USER.email,
          OTHER_TEST_USER.password,
          "en_US",
        );
        const { token: t2 } = await createToken(otherUser as User);
        otherJwt = t2;

        const device = await createDevice(BOX_TEST_USER_BOX, (user as User).id);
        deviceId = device.id;
      });

      it("should let users retrieve one of their boxes with all fields", async () => {
        // Act: Get single box
        const singleBoxRequest = new Request(
          `${BASE_URL}/users/me/boxes/${deviceId}`,
          { method: "GET", headers: { Authorization: `Bearer ${jwt}` } },
        );
        const params: Params<string> = { deviceId: deviceId };
        const singleBoxResponse = (await loader({
          request: singleBoxRequest,
          params,
        } as LoaderFunctionArgs)) as Response;
        await singleBoxResponse.json();
        // Assert: Response for single box
        expect(singleBoxResponse.status).toBe(200);
      });
      it("should deny to retrieve a box of other user", async () => {
        // Arrange
        const forbiddenRequest = new Request(
          `${BASE_URL}/users/me/boxes/${deviceId}`,
          {
            headers: { Authorization: `Bearer ${otherJwt}` },
          },
        );
        const params: Params<string> = { deviceId: deviceId };

        // Act: Try to get the original users box with the other user's JWT
        const forbiddenResponse = (await loader({
          request: forbiddenRequest,
          params,
        } as LoaderFunctionArgs)) as Response;
        const forbiddenBody = await forbiddenResponse.json();
        // Assert: Forbidden response
        expect(forbiddenResponse.status).toBe(403);
        expect(forbiddenBody.code).toBe("Forbidden");
        expect(forbiddenBody.message).toBe("User does not own this senseBox");
      });

      afterAll(async () => {
        // delete the valid test user
        await deleteUserByEmail(BOX_TEST_USER.email);
        await deleteUserByEmail(OTHER_TEST_USER.email);
      });
    });
  });
});
