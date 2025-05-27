import { type ActionFunctionArgs } from "react-router";
import { BASE_URL } from "vitest.setup";
import { action } from "~/routes/api.users.confirm-email";

describe("openSenseMap API Routes: /users", () => {
  describe("/confirm-email", () => {
    describe("POST", () => {
      it("should deny email confirmation with wrong token", async () => {
        const params = new URLSearchParams({
          token: "invalid_email-reset_token",
          email: "tester@test.test",
        });

        const request = new Request(`${BASE_URL}/users/confirm-email`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });

        const response = (await action({
          request,
        } as ActionFunctionArgs)) as Response;
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(response.headers.get("content-type")).toBe(
          "application/json; charset=utf-8",
        );
        expect(body).toHaveProperty(
          "message",
          "Invalid or expired confirmation token.",
        );
      });
    });
  });
});
