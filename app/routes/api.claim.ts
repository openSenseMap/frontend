import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { claimBox } from "~/lib/transfer-service.server";
import { getUserFromJwt } from "~/lib/jwt";

export const action = async ({ request }: ActionFunctionArgs) => {
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return json(
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
    return json(
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
      return json({ error: "token is required" }, { status: 400 });
    }

    const result = await claimBox(jwtResponse.id, token);

    return json(
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
        return json({ error: message }, { status: 410 });
      }
  
      if (message.includes("not found")) {
        return json({ error: message }, { status: 404 });
      }
  
      if (
        message.includes("required") ||
        message.includes("Invalid") ||
        message.includes("already own")
      ) {
        return json({ error: message }, { status: 400 });
      }
  }

  return json(
    { error: "Internal server error" },
    { status: 500 }
  );
};