import  { type ActionFunctionArgs } from "react-router";
import { getUserFromJwt } from "~/lib/jwt";
import { claimBox } from "~/lib/transfer-service.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return Response.json(
      {
        code: "NotAuthorized",
        message: "Unsupported content-type. Try application/json",
      },
      {
        status: 415,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      }
    );
  }

  if (request.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  const jwtResponse = await getUserFromJwt(request);


  if (typeof jwtResponse === "string") {
    return Response.json(
      {
        code: "Forbidden",
        message: "Invalid JWT. Please sign in",
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return Response.json({ error: "token is required" }, { status: 400 });
    }

    const result = await claimBox(jwtResponse.id, token);

    return Response.json(
      {
        message: "Device successfully claimed!",
        data: result,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error claiming box:", err);
    return handleClaimError(err);
  }
};

const handleClaimError = (err: unknown) => {
  if (err instanceof Error) {
    const message = err.message;

    if (
        message.includes("expired") ||
        message.includes("Invalid or expired")
      ) {
        return Response.json({ error: message }, { status: 410 });
      }
  
      if (message.includes("not found")) {
        return Response.json({ error: message }, { status: 404 });
      }
  
      if (
        message.includes("required") ||
        message.includes("Invalid") ||
        message.includes("already own")
      ) {
        return Response.json({ error: message }, { status: 400 });
      }
  }

  return Response.json(
    { error: "Internal server error" },
    { status: 500 }
  );
};