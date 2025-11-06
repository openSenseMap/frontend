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

    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 1000) : 100;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    const hasGeometry = hasGeometryParam?.toLowerCase() === "true";

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
        measurements
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

    const results = await drizzleClient.execute(query);

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

    return Response.json(
      {
        data: results,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total,
        },
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  } catch (e) {
    console.warn(e);
    return Response.json(
      {
        error: "Internal Server Error",
        message:
          "The server was unable to complete your request. Please try again later.",
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

