import { LoaderArgs, redirect } from "@remix-run/node"; // or cloudflare/deno
import { getUser } from "~/session.server";

export async function loader({ request }: LoaderArgs) {
  const user = await getUser(request);

  if (!user) {
    return redirect("/explore/login");
  } else {
    return redirect("/explore/profile/" + user.id);
  }
}
