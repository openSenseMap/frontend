import { redirect, type ActionArgs } from "@remix-run/node";

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  console.log(formData);

  return redirect("/explore");
}