import { type LoaderFunctionArgs } from "react-router";
import { BASE_URL } from "vitest.setup";
import { createToken } from "~/lib/jwt";
import { registerUser } from "~/lib/user-service.server";
import { createDevice, deleteDevice } from "~/models/device.server";
import { deleteUserByEmail } from "~/models/user.server";
import { loader } from "~/routes/api.users.me.boxes";
import { type User } from "~/schema";

const BOXES_TEST_USER = {
  name: "testing all my boxes",
  email: "test@boxes.me",
  password: "some secure password",
};
const TEST_BOX = {
  name: `'${BOXES_TEST_USER.name}'s Box`,
  exposure: "outdoor",
  expiresAt: null,
  tags: [],
  latitude: 0,
  longitude: 0,
  model: "luftdaten.info",
  mqttEnabled: false,
  ttnEnabled: false,
};

describe("openSenseMap API Routes: /users", () => {
  let jwt: string = "";
  let deviceId = "";

  describe("/me/boxes", () => {
    describe("GET", async () => {
      beforeAll(async () => {
        const user = await registerUser(
          BOXES_TEST_USER.name,
          BOXES_TEST_USER.email,
          BOXES_TEST_USER.password,
          "en_US",
        );
        const { token } = await createToken(user as User);
        jwt = token;
        const device = await createDevice(TEST_BOX, (user as User).id);
        deviceId = device.id;
      });
      it("should let users retrieve their boxes and sharedBoxes with all fields", async () => {
        // Arrange
        const request = new Request(`${BASE_URL}/users/me/boxes`, {
          method: "GET",
          headers: { Authorization: `Bearer ${jwt}` },
        });

        // Act
        const response = (await loader({
          request,
        } as LoaderFunctionArgs)) as Response;
        const body = await response?.json();

        // Assert
        expect(response.status).toBe(200);
        expect(body.data.boxes[0].integrations.mqtt).toEqual({
          enabled: false,
        });
        expect(body.data.sharedBoxes[0].integrations.mqtt).toEqual({
          enabled: false,
        });
      });

      afterAll(async () => {
        // delete the valid test user
        await deleteUserByEmail(BOXES_TEST_USER.email);
        await deleteDevice({ id: deviceId });
      });
    });
  });
});
