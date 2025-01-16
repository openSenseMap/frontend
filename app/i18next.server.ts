import { resolve } from "node:path";
import Backend from "i18next-fs-backend";
import { RemixI18Next } from "remix-i18next/server";
import { i18nCookie } from "./cookies";
import i18nextOptions from "./i18next-options";

let i18next: RemixI18Next = new RemixI18Next({
  detection: {
    // persist language selection in cookie
    cookie: i18nCookie,
    supportedLanguages: i18nextOptions.supportedLngs,
    fallbackLanguage: i18nextOptions.fallbackLng,
  },
  // This is the configuration for i18next used
  // when translating messages server-side only
  i18next: {
    ...i18nextOptions,
    backend: {
      loadPath: resolve("./public/locales/{{lng}}/{{ns}}.json"),
    },
  },
  // The backend you want to use to load the translations
  // Tip: You could pass `resources` to the `i18next` configuration and avoid
  // a backend here
  backend: Backend,
});

export default i18next;
