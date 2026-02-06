// app/lib/set-language.server.ts
//used for setting language cookie during login
import { i18nCookie } from "~/cookies";

export async function setLanguageCookie(lang: string) {
  return await i18nCookie.serialize(lang);
}
