import { redirect } from "@remix-run/node";
import { type DataFunctionArgs, json } from "@remix-run/node";
import { validator } from "~/components/header/menu/add-device";
import { validationError } from "remix-validated-form";
// import { getUserSession, sessionStorage } from "~/session.server";

export async function action({ request }: DataFunctionArgs) {
  const data = await validator.validate(await request.formData());
  if (data.error) return validationError(data.error);

  const { deviceType, general, mqtt, ttn } = data.data;

  return json({
    deviceType,
    general,
    mqtt,
    ttn,
  });
}

export async function loader() {
  return redirect("/explore");
}
