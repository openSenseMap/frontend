import { eq, and, gte, lte, sql } from "drizzle-orm";
import { type LoaderFunctionArgs } from "react-router";
import { drizzleClient } from "~/db.server";
import { deviceToLocation, location } from "~/schema";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { deviceId } = params;
  const url = new URL(request.url);
  if (!deviceId) {
    throw new Response("Missing deviceId", { status: 400 });
  }
  const format = url.searchParams.get("format");
  const fromDate = url.searchParams.get("from-date");
  const toDate = url.searchParams.get("to-date");

  const to = toDate ? new Date(toDate) : new Date(Date.now() + 60 * 1000); // allow slight future skew
  const from = fromDate
  ? new Date(fromDate)
  : new Date(Date.now() - 48 * 60 * 60 * 1000);


  const conditions = [
    eq(deviceToLocation.deviceId, deviceId),
    gte(deviceToLocation.time, from),
    lte(deviceToLocation.time, to),
  ];

  // Query unique time + location pairs
  const rows = await drizzleClient
    .select({
      timestamp: deviceToLocation.time,
      coordinates: sql<[number, number, number]>`
        ARRAY[ST_X(${location.location}), ST_Y(${location.location}), 0]
      `,
    })
    .from(deviceToLocation)
    .innerJoin(location, eq(deviceToLocation.locationId, location.id))
    .where(and(...conditions))
    .groupBy(deviceToLocation.time, location.location)
    .orderBy(deviceToLocation.time);

  if (format === "geojson") {
    const geojson = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: rows.map((r) => r.coordinates),
      },
      properties: {
        timestamps: rows.map((r) => r.timestamp.toISOString()),
      },
    };

    return new Response(JSON.stringify(geojson), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }

  const data = rows.map((r) => ({
    type: "Point",
    coordinates: r.coordinates,
    timestamp: r.timestamp.toISOString(),
  }));

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}
