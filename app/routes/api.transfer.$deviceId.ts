import { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { drizzleClient } from "~/db.server";
import { getUserFromJwt } from "~/lib/jwt";
import { getBoxTransfer } from "~/lib/transfer-service.server";
import { getTransfer } from "~/models/transfer.server";
import { claim, device } from "~/schema";

export async function loader({ params }: LoaderFunctionArgs) {
  const { deviceId } = params

  if (!deviceId) {
    return new Response(JSON.stringify({ message: 'Device ID is required.' }), {
      status: 400,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
    })
  }

  try {
    const claim = await getBoxTransfer(deviceId)

    return json( {
      data: {
        token: claim.token,
        boxId: claim.boxId
      }
    },
    { status: 200 })
  } catch (error) {
    console.error('Error fetching claim:', error)

    if (error instanceof Response) {
      throw error
    }

    throw json(
      { error: 'Internal server error while fetching claim' },
      { status: 500 },
    )
  }
}


export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const jwtResponse = await getUserFromJwt(request)

  if (typeof jwtResponse === 'string')
    return Response.json(
        {
            code: 'Forbidden',
            message:
                'Invalid JWT authorization. Please sign in to obtain new JWT.',
        },
        {
            status: 403,
        },
    )

  const url = new URL(request.url);
  
  switch (request.method) {
    case "PUT": {
        return await handleTransferUpdate(request, jwtResponse);
    }
    // case "DELETE": {
    //   return await handleCancelTransfer(request, jwtResponse);
    // }
    default: {
      return new Response(null, { status: 405 });
    }
  }
};


const handleTransferUpdate = async (request: Request, userObj: any) => {
    const formEntries = await request.formData();
    const token = formEntries.get("token")?.toString();
    const expiresAtStr = formEntries.get("expiresAt")?.toString();
  
    if (!token) {
      return json({ error: "token is required" }, { status: 400 });
    }
    if (!expiresAtStr) {
      return json({ error: "expiresAt is required" }, { status: 400 });
    }
  
    const expiresAt = new Date(expiresAtStr);
    if (isNaN(expiresAt.getTime())) {
      return json({ error: "Invalid expiration date format" }, { status: 400 });
    }
    if (expiresAt <= new Date()) {
      return json({ error: "Expiration date must be in the future" }, { status: 400 });
    }
  
    const url = new URL(request.url);
    const parts = url.pathname.split("/");
    const claimId = parts[parts.length - 1];
  
    const [existing] = await drizzleClient
      .select({
        id: claim.id,
        token: claim.token,
        expiresAt: claim.expiresAt,
        boxId: claim.boxId,
        deviceUserId: device.userId,
      })
      .from(claim)
      .innerJoin(device, eq(claim.boxId, device.id))
      .where(eq(claim.id, claimId));
  
    if (!existing) {
      return json({ error: "Transfer not found" }, { status: 404 });
    }
  
    if (existing.deviceUserId !== userObj.id) {
      return json({ error: "You don't have permission to update this transfer" }, { status: 403 });
    }
  
    if (existing.token !== token) {
      return json({ error: "Invalid transfer token" }, { status: 400 });
    }
  
    const [updated] = await drizzleClient
      .update(claim)
      .set({ expiresAt })
      .where(eq(claim.id, claimId))
      .returning();
  
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
  };

  const handleGetTransfer = async (request: Request, params: any, userObj: any) => {
    const deviceId = params.deviceId;
  
    if (!deviceId) {
      return json({ error: "Device ID is required" }, { status: 400 });
    }
  
    const [transfer] = await drizzleClient
      .select({
        id: claim.id,
        boxId: claim.boxId,
        token: claim.token,
        expiresAt: claim.expiresAt,
        createdAt: claim.createdAt,
        updatedAt: claim.updatedAt,
        deviceUserId: device.userId,
      })
      .from(claim)
      .innerJoin(device, eq(claim.boxId, device.id))
      .where(eq(claim.boxId, deviceId));
  
    if (transfer && transfer.deviceUserId !== userObj.id) {
      return json({ error: "You don't have permission to view this transfer" }, { status: 403 });
    }
  
    return json(
      {
        data: transfer || null,
      },
      { status: 200 }
    );
  };
  

  
