import { createCookie } from "@remix-run/node";

const sessionSecret = process.env.SESSION_SECRET ?? "P0JPnyms9A";

export let i18nCookie = createCookie("i18n", {
  sameSite: "lax",
  path: "/",
  secrets: [sessionSecret],
  secure: true,
});
