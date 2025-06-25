import { type ActionFunctionArgs } from "react-router";
import { BASE_URL } from "vitest.setup";
import { registerUser } from "~/lib/user-service.server";
import { deleteUserByEmail } from "~/models/user.server";
import { action } from "~/routes/api.sign-in";

const VALID_SIGN_IN_TEST_USER = {
  name: "signing in",
  email: "test@sign.in",
  password: "some secure password",
};

describe("openSenseMap API Routes: /users", () => {
  describe("/sign-in", () => {
    beforeAll(async () => {
      await registerUser(
        VALID_SIGN_IN_TEST_USER.name,
        VALID_SIGN_IN_TEST_USER.email,
        VALID_SIGN_IN_TEST_USER.password,
        "en_US",
      );
    });

    describe("/POST", () => {
      it("should deny to sign in with wrong password", async () => {
        // Arrange
        const params = new URLSearchParams();
        params.append("email", VALID_SIGN_IN_TEST_USER.email);
        params.append("password", "wrong password");
        const request = new Request(`${BASE_URL}/users/sign-in`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });

        // Act
        const dataFunctionValue = await action({
          request,
        } as ActionFunctionArgs);
        const response = dataFunctionValue as Response;

        // Assert
        expect(dataFunctionValue).toBeInstanceOf(Response);
        expect(response.status).toBe(403);
      });

      it("should allow to sign in a user with email and password", async () => {
        // Arrange
        const params = new URLSearchParams();
        params.append("email", VALID_SIGN_IN_TEST_USER.email);
        params.append("password", VALID_SIGN_IN_TEST_USER.password);
        const request = new Request(`${BASE_URL}/users/sign-in`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });

        // Act
        const dataFunctionValue = await action({
          request,
        } as ActionFunctionArgs);
        const response = dataFunctionValue as Response;
        const body = await response?.json();

        // Assert
        expect(dataFunctionValue).toBeInstanceOf(Response);
        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toBe(
          "application/json; charset=utf-8",
        );
        expect(body).toHaveProperty("token");
        expect(body).toHaveProperty("refreshToken");
      });

      it("should allow to sign in a user with name and password", async () => {
        // Arrange
        const params = new URLSearchParams();
        params.append("email", VALID_SIGN_IN_TEST_USER.name);
        params.append("password", VALID_SIGN_IN_TEST_USER.password);
        const request = new Request(`${BASE_URL}/users/sign-in`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });

        // Act
        const dataFunctionValue = await action({
          request,
        } as ActionFunctionArgs);
        const response = dataFunctionValue as Response;
        const body = await response?.json();

        // Assert
        expect(dataFunctionValue).toBeInstanceOf(Response);
        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toBe(
          "application/json; charset=utf-8",
        );
        expect(body).toHaveProperty("token");
        expect(body).toHaveProperty("refreshToken");
      });

      it("should allow to sign in a user with email (different case) and password", async () => {
        // Arrange
        const params = new URLSearchParams();
        params.append("email", VALID_SIGN_IN_TEST_USER.email.toUpperCase());
        params.append("password", VALID_SIGN_IN_TEST_USER.password);
        const request = new Request(`${BASE_URL}/users/sign-in`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });

        // Act
        const dataFunctionValue = await action({
          request,
        } as ActionFunctionArgs);
        const response = dataFunctionValue as Response;
        const body = await response?.json();

        // Assert
        expect(dataFunctionValue).toBeInstanceOf(Response);
        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toBe(
          "application/json; charset=utf-8",
        );
        expect(body).toHaveProperty("token");
        expect(body).toHaveProperty("refreshToken");
      });

      it("should deny to sign in with name in different case", async () => {
        // Arrange
        const params = new URLSearchParams();
        params.append("email", VALID_SIGN_IN_TEST_USER.name.toUpperCase());
        params.append("password", VALID_SIGN_IN_TEST_USER.password);
        const request = new Request(`${BASE_URL}/users/sign-in`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });

        // Act
        const dataFunctionValue = await action({
          request,
        } as ActionFunctionArgs);
        const response = dataFunctionValue as Response;

        // Assert
        expect(dataFunctionValue).toBeInstanceOf(Response);
        expect(response.status).toBe(403);
      });

      afterAll(async () => {
        // delete the valid test user
        await deleteUserByEmail(VALID_SIGN_IN_TEST_USER.email);
      });
    });
  });
});
