import { sql } from "drizzle-orm";
import { type LoaderFunctionArgs } from "react-router";
import { BASE_URL } from "vitest.setup";
import { drizzleClient } from "~/db.server";
import { loader } from "~/routes/api.stats";

describe("openSenseMap API Routes: /stats", () => {
  let boxCount: number = 0;
  let measurementsCount: number = 0;
  beforeAll(async () => {
    const [count] = await drizzleClient.execute(
      sql`SELECT * FROM approximate_row_count('device');`,
    );
    boxCount = Number(count.approximate_row_count);

    const [count2] = await drizzleClient.execute(
      sql`SELECT * FROM approximate_row_count('measurement');`,
    );
    measurementsCount = Number(count2.approximate_row_count);
  });

  it("should return /stats correctly", async () => {
    // Arrange
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
    expect(response.status).toBe(200);
    const [boxes, measurements] = body;
    expect(boxes).toBe(boxCount);
    expect(measurements).toBe(measurementsCount);
  });

  it("should return a json array with three numbers", async () => {
    // Arrange
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
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    expect(body).not.toBeNull();
    expect(body).toBeDefined();
    expect(Array.isArray(body)).toBe(true);
    expect(body.every((n: any) => typeof n === "number")).toBe(true);
  });

  it("should return a json array with three strings when called with parameter human=true", async () => {
    // Arrange
    const url = `${BASE_URL}/stats?human=true`;
    const request = new Request(url, {
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
    expect(body).not.toBeNull();
    expect(body).toBeDefined();
    expect(Array.isArray(body)).toBe(true);
    expect(body.every((n: any) => typeof n === "string")).toBe(true);
  });

  it("should return a json array with three numbers when called with parameter human=false", async () => {
    // Arrange
    const url = `${BASE_URL}/stats?human=false`;
    const request = new Request(url, {
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
    expect(body).not.toBeNull();
    expect(body).toBeDefined();
    expect(Array.isArray(body)).toBe(true);
    expect(body.every((n: any) => typeof n === "number")).toBe(true);
  });

  it("should return an error if parameter human is not true or false", async () => {
    // Arrange
    const urls = [
      `${BASE_URL}/stats?human=wrong1`,
      `${BASE_URL}/stats?human=wrong2`,
    ];
    const requests = urls.map(
      (url) =>
        new Request(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        }),
    );

    // Act
    const responses = await Promise.all(
      requests.map((request) =>
        loader({
          request: request,
        } as LoaderFunctionArgs),
      ),
    );
    const bodies = await Promise.all(responses.map((res) => res.json()));

    // Assert
    for (let i = 0; i < responses.length; i++) {
      expect(responses[i].status).toBe(400);
      expect(responses[i].headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(bodies[i].message).toBe(
        "Illegal value for parameter human. allowed values: true, false",
      );
    }
  });
});
