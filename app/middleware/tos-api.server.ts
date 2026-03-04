import { getUserFromJwt } from "~/lib/jwt";
import { getTosRequirementForUser } from "~/models/tos.server";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
type AllowRule = {
  method: HttpMethod | '*'
  pathname: string | RegExp
}

const API_TOS_ALLOWLIST: AllowRule[] = [
  { method: 'POST', pathname: '/api/users/refresh-auth' },
  { method: 'POST', pathname: '/api/users/sign-out' },

  { method: 'DELETE', pathname: '/api/users/me' },

  { method: 'DELETE', pathname: /^\/api\/boxes\/[^/]+$/ },

  { method: 'POST', pathname: '/api/users/me/accept-tos' },
]

function isAllowedApi(request: Request, pathname: string) {
  const method = request.method as HttpMethod

  return API_TOS_ALLOWLIST.some((rule) => {
    if (rule.method !== '*' && rule.method !== method) return false

    if (rule.pathname instanceof RegExp) {
      return rule.pathname.test(pathname)
    }

    return rule.pathname === pathname
  })
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
        effectiveFrom: req.tos.effectiveFrom,
      },
      428,
    );
  }

  return next();
}