import type { ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { i18nCookie } from "~/cookies";

/**
 * This loader is used to prevent direct access to the action.
 *
 * The loader returns a 405 status code, which indicates that the method is not allowed.
 */
export async function loader() {
  return json("Not allowed", { status: 405 });
}

/**
 * This action is used to set the user's preferred language.
 *
 * The action gets the language from the form data, and sets the cookie for the language.
 * The action also returns a 200 status code, which indicates that the request was successful.
 */
export async function action({ request }: ActionArgs) {
  const lang = (await request.formData()).get("language");
  return json(
    {},
    {
      headers: {
        "Set-Cookie": await i18nCookie.serialize(lang),
      },
    }
  );
}
