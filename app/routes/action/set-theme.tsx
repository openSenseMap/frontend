import type { ActionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";

import { isTheme } from "~/utils/theme-provider";
import { getThemeSession } from "~/utils/theme.server";

export const action = async ({ request }: ActionArgs) => {
  const themeSession = await getThemeSession(request);
  console.log("🚀 ~ file: set-theme.tsx:9 ~ action ~ themeSession:", themeSession)
  const requestText = await request.text();
  console.log("🚀 ~ file: set-theme.tsx:10 ~ action ~ requestText:", requestText)
  const form = new URLSearchParams(requestText);
  const theme = form.get("theme");
  console.log("🚀 ~ file: set-theme.tsx:13 ~ action ~ theme:", theme)

  if (!isTheme(theme)) {
    return json({
      success: false,
      message: `theme value of ${theme} is not a valid theme`,
    });
  }

  themeSession.setTheme(theme);
  return json(
    { success: true },
    { headers: { "Set-Cookie": await themeSession.commit() } }
  );
};

export const loader = async () => redirect("/", { status: 404 });
