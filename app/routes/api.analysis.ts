import { type LoaderFunctionArgs } from "react-router";
import { drizzleClient } from "~/db.server";
import { sql } from "drizzle-orm";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");
    const boxIdParam = url.searchParams.get("boxId");
    const hasGeometryParam = url.searchParams.get("hasGeometry");
    const markAsReadParam = url.searchParams.get("markAsRead");

    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 1000) : 100;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    const hasGeometry = hasGeometryParam?.toLowerCase() === "true";
    const markAsRead = markAsReadParam?.toLowerCase() === "true";

    let query = sql`
      SELECT 
        "createdAt",
        "boxId",
        tags,
        CASE 
          WHEN geometry IS NOT NULL 
          THEN ST_AsGeoJSON(geometry)::jsonb
          ELSE NULL 
        END as geometry,
        temperature,
        soil_temperature,
        humidity,
        soil_moisture,
        pressure,
        pm1,
        pm2_5,
        pm4,
        pm10,
        wind_speed,
        light_intensity,
        uv_intensity,
        uv_index,
        sound_level,
        sound_level_eq,
        sound_level_min,
        sound_level_max,
        voc,
        co2
      FROM analysis_view
      WHERE 1=1
    `;

    if (boxIdParam) {
      query = sql`${query} AND "boxId" = ${boxIdParam}`;
    }

    if (hasGeometry) {
      query = sql`${query} AND geometry IS NOT NULL`;
    }

    query = sql`${query} ORDER BY "createdAt" DESC LIMIT ${limit} OFFSET ${offset}`;

    const results = await drizzleClient.execute<Record<string, any>>(query);

    // Get total count for pagination
    let countQuery = sql`SELECT COUNT(*) as total FROM analysis_view WHERE 1=1`;
    if (boxIdParam) {
      countQuery = sql`${countQuery} AND "boxId" = ${boxIdParam}`;
    }
    if (hasGeometry) {
      countQuery = sql`${countQuery} AND geometry IS NOT NULL`;
    }
    const [countResult] = await drizzleClient.execute(countQuery);
    const total = Number(countResult.total);

    // If markAsRead is true, mark the returned items as processed
    if (markAsRead && results.length > 0) {
      // Mark each returned item as processed
      // Using individual inserts with ON CONFLICT for reliability
      for (const row of results) {
        // Convert createdAt to ISO string format for PostgreSQL
        const createdAt = row.createdAt instanceof Date 
          ? row.createdAt.toISOString()
          : typeof row.createdAt === 'string'
          ? row.createdAt
          : new Date(row.createdAt).toISOString();
        
        await drizzleClient.execute(
          sql`
            INSERT INTO processed_measurements (device_id, time, processed_at)
            VALUES (${row.boxId}, ${createdAt}::timestamptz, NOW())
            ON CONFLICT (device_id, time) DO NOTHING
          `
        );
      }

      // Refresh the materialized view to exclude processed measurements
      // Use CONCURRENTLY to avoid locking (requires unique index)
      await drizzleClient.execute(
        sql`REFRESH MATERIALIZED VIEW CONCURRENTLY analysis_view`
      );
    }

    return Response.json(
      {
        data: results,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total,
        },
        markedAsRead: markAsRead ? results.length : 0,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  } catch (e) {
    console.error("Error in /api/analysis:", e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    return Response.json(
      {
        error: "Internal Server Error",
        message:
          "The server was unable to complete your request. Please try again later.",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  }
}

