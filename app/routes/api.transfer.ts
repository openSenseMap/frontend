import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  createBoxTransfer,
  removeBoxTransfer,
  validateTransferParams,
} from "~/lib/transfer-service.server";
import { getUserFromJwt } from "~/lib/jwt";

export const action = async ({ request }: ActionFunctionArgs) => {
  const jwtResponse = await getUserFromJwt(request);

  if (typeof jwtResponse === "string") {
    return json(
      {
        code: "Forbidden",
        message:
          "Invalid JWT authorization. Please sign in to obtain new JWT.",
      },
      { status: 403 }
    );
  }

  if (request.method !== "POST" && request.method !== "DELETE") {
    return new Response(null, { status: 405 });
  }

  switch (request.method) {
    case "POST": {
      return handleCreateTransfer(request, jwtResponse);
    }
    case "DELETE": {
      return handleRemoveTransfer(request, jwtResponse);
    }
  }
};

const handleCreateTransfer = async (request: Request, user: any) => {
  try {
    let boxId: string | undefined;
    let expiresAt: string | undefined;

    const contentType = request.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const body = await request.json();
      boxId = body.boxId;
      expiresAt = body.expiresAt || body.date; // Support both param names for backwards compatibility
    } else {
      const formData = await request.formData();
      boxId = formData.get("boxId")?.toString();
      expiresAt =
        formData.get("expiresAt")?.toString() ||
        formData.get("date")?.toString();
    }

    const validation = validateTransferParams(boxId, expiresAt);
    if (!validation.isValid) {
      return json({ error: validation.error }, { status: 400 });
    }

    const transferCode = await createBoxTransfer(user.id, boxId!, expiresAt);

    return json(
      {
        message: "Box successfully prepared for transfer",
        data: transferCode,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating transfer:", err);
    return handleTransferError(err);
  }
};

const handleRemoveTransfer = async (request: Request, user: any) => {
  try {
    let boxId: string | undefined;
    let token: string | undefined;

    const contentType = request.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const body = await request.json();
      boxId = body.boxId;
      token = body.token;
    } else {
      const formData = await request.formData();
      boxId = formData.get("boxId")?.toString();
      token = formData.get("token")?.toString();
    }

    if (!boxId) {
      return json({ error: "boxId is required" }, { status: 400 });
    }

    if (!token) {
      return json({ error: "token is required" }, { status: 400 });
    }

    await removeBoxTransfer(user.id, boxId, token);

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("Error removing transfer:", err);
    return handleTransferError(err);
  }
};

const handleTransferError = (err: unknown) => {
  if (err instanceof Error) {
    const message = err.message;

    if (message.includes("not found")) {
      return json({ error: message }, { status: 404 });
    }

    if (
      message.includes("permission") ||
      message.includes("don't have") ||
      message.includes("not the owner")
    ) {
      return json({ error: message }, { status: 403 });
    }

    if (
      message.includes("expired") ||
      message.includes("Invalid") ||
      message.includes("required") ||
      message.includes("format") ||
      message.includes("future")
    ) {
      return json({ error: message }, { status: 400 });
    }
  }

  return json(
    { error: "Internal server error" },
    { status: 500 }
  );
};