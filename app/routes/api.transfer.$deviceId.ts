import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  getBoxTransfer,
  updateBoxTransferExpiration,
} from "~/lib/transfer-service.server";
import { getUserFromJwt } from "~/lib/jwt";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
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

  const { deviceId } = params;

  if (!deviceId) {
    return json({ error: "Device ID is required" }, { status: 400 });
  }

  try {
    // Get transfer details - will throw if user doesn't own the device or transfer doesn't exist
    const transfer = await getBoxTransfer(jwtResponse.id, deviceId);

    return json(
      {
        data: {
          id: transfer.id,
          token: transfer.token,
          boxId: transfer.boxId,
          expiresAt: transfer.expiresAt,
          createdAt: transfer.createdAt,
          updatedAt: transfer.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching transfer:", err);
    return handleTransferError(err);
  }
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
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

  const { deviceId } = params;

  if (!deviceId) {
    return json({ error: "Device ID is required" }, { status: 400 });
  }

  if (request.method !== "PUT") {
    return new Response(null, { status: 405 });
  }

  const contentType = request.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  return handleUpdateTransfer(request, jwtResponse, deviceId, isJson);
};

const handleUpdateTransfer = async (
  request: Request,
  user: any,
  deviceId: string,
  isJson: boolean | undefined
) => {
  try {
    let token: string | undefined;
    let expiresAt: string | undefined;

    if (isJson) {
      const body = await request.json();
      token = body.token;
      expiresAt = body.expiresAt;
    } else {
      const formData = await request.formData();
      token = formData.get("token")?.toString();
      expiresAt = formData.get("expiresAt")?.toString();
    }

    if (!token) {
      return json({ error: "token is required" }, { status: 400 });
    }

    if (!expiresAt) {
      return json({ error: "expiresAt is required" }, { status: 400 });
    }

    const updated = await updateBoxTransferExpiration(
      user.id,
      deviceId,
      token,
      expiresAt
    );

    return json(
      {
        message: "Transfer successfully updated",
        data: {
          id: updated.id,
          boxId: updated.boxId,
          token: updated.token,
          expiresAt: updated.expiresAt,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating transfer:", err);
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