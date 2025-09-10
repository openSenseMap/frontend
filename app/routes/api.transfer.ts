import { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { createBoxTransfer, removeBoxTransfer } from "~/lib/transfer-service.server";
import { getUserFromJwt } from "~/lib/jwt";

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
    case "POST": {
        return await handleCreateTransfer(request, jwtResponse);
    }
    case "DELETE": {
      return await handleRemoveTransfer(request, jwtResponse);
    }
    default: {
      return new Response(null, { status: 405 });
    }
  }
};

const handleCreateTransfer = async (request: Request, user: any) => {
  const formEntries = await request.formData();
  const boxId = formEntries.get("boxId")?.toString();
  const expiresAt = formEntries.get("expiresAt")?.toString();

  if (!boxId) {
    return json({ error: "boxId is required" }, { status: 400 });
  }

  try {
    const transferCode = await createBoxTransfer(user.id, boxId, expiresAt);
    return json(
      {
        message: 'Box successfully prepared for transfer',
        data: transferCode,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating transfer:', err);
    return json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: err instanceof Error && err.message.includes('permission') ? 403 : 500 }
    );
  }
};

const handleRemoveTransfer = async (request: Request, user: any) => {
  const formEntries = await request.formData();
  const boxId = formEntries.get("boxId")?.toString();
  const token = formEntries.get("token")?.toString();

  if (!boxId) {
    return json({ error: "boxId is required" }, { status: 400 });
  }

  if (!token) {
    return json({ error: "token is required" }, { status: 400 });
  }

  try {
    await removeBoxTransfer(user.id, boxId, token);
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Error removing transfer:', err);
    if (err instanceof Error) {
      if (err.message.includes('not found')) {
        return json({ error: err.message }, { status: 404 });
      }
      if (err.message.includes('permission')) {
        return json({ error: err.message }, { status: 403 });
      }
    }
    return json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
};