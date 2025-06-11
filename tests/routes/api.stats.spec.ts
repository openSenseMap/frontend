import { type LoaderFunctionArgs } from "react-router";
import { BASE_URL } from "vitest.setup";
import { loader } from "~/routes/api.stats";

describe("openSenseMap API Routes: /stats", () => {
  it("should return /stats correctly", async () => {
    // Arrange
    const boxCount = 10; // Replace with your actual boxCount value or import it
    const request = new Request(`${BASE_URL}/stats`, {
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
    const [boxes, measurements] = body;
    expect(boxes).toBe(boxCount);
    expect(measurements).toBe(0);
  });
});
