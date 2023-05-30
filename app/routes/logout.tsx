import type { ActionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { logout } from "~/session.server";

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const redirectTo = formData.get("redirectTo");
  console.log(redirectTo);
  return logout({request, redirectTo});
}

export async function loader() {
  return redirect("/explore/login");
}
