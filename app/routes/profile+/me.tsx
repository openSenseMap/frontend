import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router"; // or cloudflare/deno
import { getProfileByUserId } from "~/models/profile.server";
import { getUser } from "~/session.server";

// Redirect to dynamic profile page with logged in user
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);

  if (!user) {
    return redirect("/explore/login");
  } else {
    const profile = await getProfileByUserId(user.id);
    if (!profile) {
      throw new Error();
    }
    return redirect("/profile/" + profile.username);
  }
}
