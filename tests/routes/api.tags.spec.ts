import { type LoaderFunctionArgs } from "react-router";
import { BASE_URL } from "vitest.setup";
import { createToken } from "~/lib/jwt";
import { registerUser } from "~/lib/user-service.server";
import { createDevice, deleteDevice } from "~/models/device.server";
import { deleteUserByEmail } from "~/models/user.server";
import { loader } from "~/routes/api.tags";
import { type User } from "~/schema";

const TAGS_TEST_USER = {
  name: "testing all my tags",
  email: "test@tags.me",
  password: "some secure password",
};
const TEST_TAG_BOX = {
  name: `'${TAGS_TEST_USER.name}'s Box`,
  exposure: "outdoor",
  expiresAt: null,
  tags: ["tag1", "tag2"],
  latitude: 0,
  longitude: 0,
  model: "luftdaten.info",
  mqttEnabled: false,
  ttnEnabled: false,
};

describe("openSenseMap API Routes: /tags", () => {
  let userId: string = "";
  let deviceId: string = "";

  beforeAll(async () => {
    const user = await registerUser(
      TAGS_TEST_USER.name,
      TAGS_TEST_USER.email,
      TAGS_TEST_USER.password,
      "en_US",
    );
    userId = (user as User).id;
  });

  it("should return empty array of tags when none are there", async () => {
    // Arrange
    const request = new Request(`${BASE_URL}/tags`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    // Act
    const dataFunctionValue = await loader({
      request: request,
    } as LoaderFunctionArgs);
    const response = dataFunctionValue as Response;
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(0);
  });

  it("should return distinct grouptags of boxes", async () => {
    // Arrange
    const request = new Request(`${BASE_URL}/tags`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const device = await createDevice(TEST_TAG_BOX, userId);
    deviceId = device.id;

    // Act
    const dataFunctionValue = await loader({
      request: request,
    } as LoaderFunctionArgs);
    const response = dataFunctionValue as Response;
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(2);
  });

  afterAll(async () => {
    // delete the valid test user
    await deleteUserByEmail(TAGS_TEST_USER.email);
    await deleteDevice({ id: deviceId });
  });
});
