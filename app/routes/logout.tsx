import  { type ActionFunctionArgs, redirect  } from "react-router";
import ErrorMessage from "~/components/error-message";

import { logout } from "~/utils/session.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const redirectTo = formData.get("redirectTo")?.toString() || "/explore";
  return logout({ request, redirectTo });
}

export async function loader() {
  return redirect("/explore/login");
}

export function ErrorBoundary() {
  return <ErrorMessage />;
}
