import type { LinksFunction, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { getEnv } from "./env.server";
import { getUser } from "./session.server";
import tailwindStylesheetUrl from "./styles/tailwind.css";
import appStylesheetUrl from "./styles/app.css";
import { ThemeProvider, useTheme } from "./utils/themeProvider";
import clsx from "clsx";
import i18next from "./i18next.server";
import { useTranslation } from "react-i18next";
import { useChangeLanguage } from "remix-i18next";

export const links: LinksFunction = () => {
  return [
    {
      rel: "preload",
      as: "font",
      href: "/fonts/RobotoSlab-Medium.woff2",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
    {
      rel: "preload",
      as: "font",
      href: "/fonts/RobotoSlab-Regular.woff2",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
    {
      rel: "preload",
      as: "font",
      href: "/fonts/Urbanist-Medium.woff2",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
    {
      rel: "preload",
      as: "font",
      href: "/fonts/Urbanist-Regular.woff2",
      type: "font/woff2",
      crossOrigin: "anonymous",
    },
    { rel: "icon", href: "/favicon.ico" },
    { rel: "stylesheet", href: tailwindStylesheetUrl },
    { rel: "stylesheet", href: appStylesheetUrl },
  ];
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "openSenseMap",
  viewport: "width=device-width,initial-scale=1",
});

export async function loader({ request }: LoaderArgs) {
  return json({
    user: await getUser(request),
    locale: await i18next.getLocale(request),
    ENV: getEnv(),
  });
}

export let handle = {
  // In the handle export, we can add a i18n key with namespaces our route
  // will need to load. This key can be a single string or an array of strings.
  // TIP: In most cases, you should set this to your defaultNS from your i18n config
  // or if you did not set one, set it to the i18next default namespace "translation"
  i18n: "common",
};

function App() {
  const { locale, ENV } = useLoaderData<typeof loader>();
  const [theme] = useTheme();

  let { i18n } = useTranslation();

  // This hook will change the i18n instance language to the current locale
  // detected by the loader, this way, when we do something to change the
  // language, this locale will change and i18next will load the correct
  // translation files
  useChangeLanguage(locale);

  return (
    <html lang={locale} dir={i18n.dir()} className={clsx(theme)}>
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)}`,
          }}
        />
        <LiveReload />
      </body>
    </html>
  );
}

export default function AppWithProviders() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}
