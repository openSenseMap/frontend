import { createCookieSessionStorage, redirect } from "react-router";
import invariant from "tiny-invariant";
import { getUserById } from "~/models/user.server";
import  { type User } from "~/schema";

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");

const isProduction = process.env.NODE_ENV === "production";

export const authSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "en_session",
    sameSite: "lax", // CSRF protection is advised if changing to 'none'
    path: "/",
    httpOnly: true,
    secrets: process.env.SESSION_SECRET
      ? [process.env.SESSION_SECRET]
      : ["s3cr3t"],
    ...(isProduction ? { domain: "opensensemap.org", secure: true } : {}),
  },
});

// we have to do this because every time you commit the session you overwrite it
// so we store the expiration time in the cookie and reset it every time we commit
const originalCommitSession = authSessionStorage.commitSession;

Object.defineProperty(authSessionStorage, "commitSession", {
  value: async function commitSession(
    ...args: Parameters<typeof originalCommitSession>
  ) {
    const [session, options] = args;
    if (options?.expires) {
      session.set("expires", options.expires);
    }
    if (options?.maxAge) {
      session.set("expires", new Date(Date.now() + options.maxAge * 1000));
    }
    const expires = session.has("expires")
      ? new Date(session.get("expires"))
      : undefined;
    const setCookieHeader = await originalCommitSession(session, {
      ...options,
      expires,
    });
    return setCookieHeader;
  },
});

const USER_SESSION_KEY = "userId";

export async function getUserSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return authSessionStorage.getSession(cookie);
}

export async function getUserId(
  request: Request,
): Promise<User["id"] | undefined> {
  const session = await getUserSession(request);
  const userId = session.get(USER_SESSION_KEY);
  return userId;
}

export async function getUserEmail(request: Request) {
  const userId = await getUserId(request);
  if (userId === undefined) return null;

  const user = await getUserById(userId);
  if (user) return user.email;

  throw await logout({ request: request, redirectTo: "/explore" });
}

export async function getUserName(request: Request) {
  const userId = await getUserId(request);
  if (userId === undefined) return null;

  const user = await getUserById(userId);
  if (user) return user.name;

  throw await logout({ request: request, redirectTo: "/explore" });
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (userId === undefined) return null;

  const user = await getUserById(userId);
  if (user) return user;

  throw await logout({ request: request, redirectTo: "/explore" });
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname,
) {
  const userId = await getUserId(request);
  if (!userId) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function requireUser(request: Request) {
  const userId = await requireUserId(request);

  const user = await getUserById(userId);
  if (user) return user;

  throw await logout({ request: request, redirectTo: "/explore" });
}

export async function createUserSession({
  request,
  userId,
  remember,
  redirectTo,
}: {
  request: Request;
  userId: string;
  remember: boolean;
  redirectTo: string;
}) {
  const session = await getUserSession(request);
  session.set(USER_SESSION_KEY, userId);
  session.flash("global_message", "You successfully logged in.");
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await authSessionStorage.commitSession(session, {
        maxAge: remember
          ? 60 * 60 * 24 * 7 // 7 days
          : undefined,
      }),
    },
  });
}

export async function logout({
  request,
  redirectTo,
}: {
  request: Request;
  redirectTo: string;
}) {
  const session = await getUserSession(request);
  session.unset(USER_SESSION_KEY);
  session.flash("global_message", "You successfully logged out.");
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await authSessionStorage.commitSession(session),
    },
  });
}
