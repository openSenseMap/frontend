import { getUserFromJwt } from "~/lib/jwt";
import { getTosRequirementForUser } from "~/models/tos.server";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function isAllowedApi(request: Request, pathname: string) {
  if (request.method === "POST" && pathname === "/api/users/refresh-auth") return true;
  if (request.method === "POST" && pathname === "/api/users/sign-out") return true;

  if (request.method === "DELETE" && pathname === "/api/users/me") return true;

  if (request.method === "DELETE" && /^\/api\/boxes\/[^/]+$/.test(pathname)) return true;

  if (request.method === "POST" && pathname === "/api/users/me/accept-tos") return true;

  return false;
}

export async function tosApiMiddleware(
  { request }: { request: Request },
  next: () => Promise<Response>,
) {
  const url = new URL(request.url);

  const jwtUser = await getUserFromJwt(request);
  if (typeof jwtUser !== "object") {
    return next();
  }

  if (isAllowedApi(request, url.pathname)) {
    return next();
  }

  const req = await getTosRequirementForUser(jwtUser.id);
  if (req.required && req.tos) {
    return json(
      {
        code: "tos_required",
        tosVersionId: req.tos.id,
        effectiveAt: req.tos.effectiveAt,
      },
      428,
    );
  }

  return next();
}