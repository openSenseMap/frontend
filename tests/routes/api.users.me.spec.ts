import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { BASE_URL } from "vitest.setup";
import { createToken } from "~/lib/jwt";
import { registerUser } from "~/lib/user-service.server";
import { deleteUserByEmail } from "~/models/user.server";
import { loader as meLoader, action as meAction } from "~/routes/api.users.me";
import { type User } from "~/schema";

const ME_TEST_USER = {
  name: "meTest",
  email: "test@me.endpoint",
  password: "highlySecurePasswordForTesting",
};

const ME_UPDATE_EMAIL = "test.updated@me.endpoint";
const ME_UPDATE_NAME = "me2Test";

describe("openSenseMap API Routes: /users", () => {
  let jwt: string = "";

  beforeAll(async () => {
    const user = await registerUser(
      ME_TEST_USER.name,
      ME_TEST_USER.email,
      ME_TEST_USER.password,
      "en_US",
    );
    const { token: t } = await createToken(user as User);
    jwt = t;
  });

  describe("/me", () => {
    it("should allow users to request their details", async () => {
      // Arrange
      const request = new Request(`${BASE_URL}/users/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${jwt}` },
      });

      // Act
      const dataFunctionValue = await meLoader({
        request: request,
      } as LoaderFunctionArgs);
      const response = dataFunctionValue as Response;
      const body = await response?.json();

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(body).toMatchObject({
        code: "Ok",
        data: { me: { email: ME_TEST_USER.email } },
      });
    });

    it("should deny to change email and password at the same time", async () => {
      const request = new Request(`${BASE_URL}/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "new-email@email.www",
          newPassword: "87654321",
        }),
      });

      const response = (await meAction({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty(
        "message",
        "You cannot change your email address and password in the same request.",
      );
    });

    it("should deny to change email without current passsword", async () => {
      const request = new Request(`${BASE_URL}/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "new-email@email.www" }),
      });

      const response = (await meAction({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty(
        "message",
        "To change your password or email address, please supply your current password.",
      );
    });

    it("should deny to change email with wrong current passsword", async () => {
      const request = new Request(`${BASE_URL}/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "new-email@email.www",
          currentPassword: "wrongpassword",
        }),
      });

      const response = (await meAction({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(body).toHaveProperty("message", "Password incorrect");
    });

    it("should allow to change email with correct current passsword", async () => {
      // Change email
      const putRequest = new Request(`${BASE_URL}/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: ME_UPDATE_EMAIL,
          currentPassword: ME_TEST_USER.password,
        }),
      });
      const putResponse = (await meAction({
        request: putRequest,
      } as ActionFunctionArgs)) as Response;
      const putBody = await putResponse.json();

      expect(putResponse.status).toBe(200);
      expect(putBody).toHaveProperty(
        "message",
        "User successfully saved. E-Mail changed. Please confirm your new address. Until confirmation, sign in using your old address",
      );

      // Fetch updated user
      const getRequest = new Request(`${BASE_URL}/users/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const getResponse = (await meLoader({
        request: getRequest,
      } as ActionFunctionArgs)) as Response;
      const getBody = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getBody.data.me.email).toBe(ME_TEST_USER.email);
    });

    it("should allow to change name", async () => {
      // Change name
      const putRequest = new Request(`${BASE_URL}/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: ME_UPDATE_NAME }),
      });
      const putResponse = (await meAction({
        request: putRequest,
      } as ActionFunctionArgs)) as Response;
      const putBody = await putResponse.json();

      expect(putResponse.status).toBe(200);
      expect(putBody).toHaveProperty(
        "message",
        "User successfully saved. Name changed.",
      );

      // Fetch updated user
      const getRequest = new Request(`${BASE_URL}/users/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const getResponse = (await meLoader({
        request: getRequest,
      } as ActionFunctionArgs)) as Response;
      const getBody = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getBody.data.me.name).toBe(ME_UPDATE_NAME);
    });

    it("should return that no changed properties are applied and user remains unchanged", async () => {
      const request = new Request(`${BASE_URL}/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: ME_UPDATE_NAME }),
      });

      const response = (await meAction({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty(
        "message",
        "No changed properties supplied. User remains unchanged.",
      );
    });

    it("should deny to change name to existing name", async () => {
      const request = new Request(`${BASE_URL}/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: ME_UPDATE_NAME,
          currentPassword: ME_TEST_USER.password,
        }),
      });

      const response = (await meAction({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty(
        "message",
        "No changed properties supplied. User remains unchanged.",
      );
    });

    it("should deny to change password with too short new password", async () => {
      const request = new Request(`${BASE_URL}/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword: "short",
          currentPassword: ME_TEST_USER.password,
        }),
      });

      const response = (await meAction({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toHaveProperty(
        "message",
        "New password should have at least 8 characters",
      );
    });

    it("should deny to change email to invalid email", async () => {
      const request = new Request(`${BASE_URL}/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "invalid email",
          currentPassword: ME_TEST_USER.password,
        }),
      });

      const response = (await meAction({
        request,
      } as ActionFunctionArgs)) as Response;

      expect(response.status).toBe(400);
    });

    it("should deny to change name to invalid name", async () => {
      const request = new Request(`${BASE_URL}/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: " invalid name",
          currentPassword: ME_TEST_USER.password,
        }),
      });

      const response = (await meAction({
        request,
      } as ActionFunctionArgs)) as Response;

      expect(response.status).toBe(400);
    });
  });

  afterAll(async () => {
    // delete the valid test user
    await deleteUserByEmail(ME_TEST_USER.email);
    await deleteUserByEmail(ME_UPDATE_EMAIL);
  });
});
