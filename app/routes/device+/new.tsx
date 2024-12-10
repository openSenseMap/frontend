import {
  type ActionFunctionArgs,
  redirect,
  type LoaderFunctionArgs,
  json,
} from "@remix-run/node";
import ValidationStepperForm from "~/components/device/new/new-device-stepper";
import { NavBar } from "~/components/nav-bar";
import { getUser } from "~/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return redirect("/login");
  }
  return {};
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  console.log("🚀 ~ action ~ formData:", formData);

  // Extract data
  const data = Object.fromEntries(formData);

  // Perform server-side validation (optional)
  try {
    // Example: Save the data to a database or call an API
    console.log("Submitted Data:", data);

    // On success, redirect or return a success message
    return data;
  } catch (error) {
    // Handle errors and send response back to the form
    return json({ error: "An error occurred" }, { status: 400 });
  }
}

export default function NewDevice() {
  return (
    <div className="flex flex-col h-screen">
      <NavBar />
      <div className="flex-grow bg-gray-100 overflow-auto">
        <div className="flex h-full w-full justify-center py-10">
          <div className="w-full h-full flex items-center justify-center rounded-lg p-6 dark:shadow-none dark:bg-transparent dark:text-dark-text">
            <ValidationStepperForm />
          </div>
        </div>
      </div>
    </div>
  );
}
