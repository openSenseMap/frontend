import { type ActionFunctionArgs } from "react-router";
import { BASE_URL } from "vitest.setup";
import { action as userAction } from "~/routes/api.users";

describe("openSenseMap API Routes: /users", () => {
  describe("/POST", () => {
    it("should redirect POST requests to /users/register", async () => {
      // Arrange
      const params = new URLSearchParams({
        name: "testuser",
        email: "test@example.com",
        password: "password123",
      });
      const request = new Request(`${BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      // Act
      const dataFunctionValue = await userAction({
        request: request,
      } as ActionFunctionArgs);
      const response = dataFunctionValue as Response;
      const body = await response?.json();

      // Assert
      expect(dataFunctionValue).toBeInstanceOf(Response);
      expect(response.status).toBe(308);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(response.headers.get("Location")).toBe("/api/users/register");
      expect(body).toHaveProperty("message", "User registration has been moved to /api/users/register");
    });

    it("should return 405 for non-POST requests", async () => {
      // Arrange
      const request = new Request(`${BASE_URL}/users`, {
        method: "GET",
      });

      // Act
      const dataFunctionValue = await userAction({
        request: request,
      } as ActionFunctionArgs);
      const response = dataFunctionValue as Response;

      // Assert
      expect(dataFunctionValue).toBeInstanceOf(Response);
      expect(response.status).toBe(405);
    });
  });
});