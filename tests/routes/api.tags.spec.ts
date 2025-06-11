import { type LoaderFunctionArgs } from "react-router";
import { BASE_URL } from "vitest.setup";
import { loader } from "~/routes/api.tags";

describe("openSenseMap API Routes: /tags", () => {
  it("should return distinct grouptags of boxes", async () => {
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
    expect(body.data).toHaveLength(2);
  });
});
