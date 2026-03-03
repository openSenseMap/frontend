import { type ActionFunctionArgs } from "react-router";
import { drizzleClient } from "~/db.server";
import { getUserFromJwt } from "~/lib/jwt";
import { getCurrentEffectiveTos } from "~/models/tos.server";
import { tosAcceptance } from "~/schema/tos";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const jwtUser = await getUserFromJwt(request);
  if (typeof jwtUser !== "object") {
    return new Response(
      JSON.stringify({ code: "invalid_jwt" }),
      { status: 403, headers: { "content-type": "application/json; charset=utf-8" } },
    );
  }

  const tos = await getCurrentEffectiveTos();
  if (!tos) {
    return new Response(
      JSON.stringify({ code: "tos_missing" }),
      { status: 500, headers: { "content-type": "application/json; charset=utf-8" } },
    );
  }

  await drizzleClient
    .insert(tosAcceptance)
    .values({ userId: jwtUser.id, tosVersionId: tos.id })
    .onConflictDoNothing();

  return new Response(null, { status: 204 });
}