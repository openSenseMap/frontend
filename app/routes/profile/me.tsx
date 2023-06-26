import type { LoaderArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node"; // or cloudflare/deno
import { getUser } from "~/session.server";

// Redirect to dynamic profile page with logged in user
export async function loader({ request }: LoaderArgs) {
  const user = await getUser(request);

  if (!user) {
    return redirect("/explore/login");
  } else {
    return redirect("/profile/" + user.name);
  }
}
