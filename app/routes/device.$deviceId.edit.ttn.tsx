import { Save } from "lucide-react";
import  { type LoaderFunctionArgs, redirect , Form  } from "react-router";
import ErrorMessage from "~/components/error-message";
import { getUserId } from "~/utils/session.server";

//*****************************************************
export async function loader({ request }: LoaderFunctionArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  return "";
}

//*****************************************************
export async function action() {
  return "";
}

//**********************************
export default function EditBoxTTN() {
  return (
    <div className="grid grid-rows-1">
      <div className="flex min-h-full items-center justify-center">
        <div className="mx-auto w-full font-helvetica text-[14px]">
          {/* Form */}
          <Form method="post" noValidate>
            {/* Heading */}
            <div>
              {/* Title */}
              <div className="mt-2 flex justify-between">
                <div>
                  <h1 className=" text-4xl">TheThingsNetwork - TTN</h1>
                </div>
                <div>
                  {/* Save button */}
                  <button
                    name="intent"
                    value="save"
                    className=" h-12 w-12 rounded-full border-[1.5px] border-[#9b9494] hover:bg-[#e7e6e6]"
                  >
                    <Save className="mx-auto h-5 w-5 lg:h-7 lg:w-7" />
                  </button>
                </div>
              </div>
            </div>

            {/* divider */}
            <hr className="my-3 mt-6 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

            <div className="my-5 rounded border border-[#faebcc] bg-[#fcf8e3] p-4 text-[#8a6d3b]">
              <p>
                openSenseMap offers an integration with{" "}
                <a
                  href="https://www.thethingsnetwork.org/"
                  className="cursor-pointer text-[#4eaf47]"
                >
                  TheThingsNetwork.{" "}
                </a>
                Documentation for the parameters is provided{" "}
                <a
                  href="https://github.com/sensebox/ttn-osem-integration"
                  className="cursor-pointer text-[#4eaf47]"
                >
                  on GitHub
                </a>
              </p>
            </div>

            {/* Decoding Profile */}
            <div>
              <label
                htmlFor="decProfile"
                className="txt-base block font-bold tracking-normal"
              >
                Decoding Profile
              </label>

              <div className="mt-1">
                <select
                  id="decProfile"
                  name="decProfile"
                  className="appearance-auto w-full rounded border border-gray-200 px-2 py-1.5 text-base"
                >
                  <option value="senseBox/home">senseBox:home</option>
                  <option value="lora-serialization">LoRa serialization</option>
                  <option value="json">JSON</option>
                  <option value="cayenne-lpp">Cayenne LPP (beta)</option>
                </select>
              </div>
            </div>

            {/* TTN Application ID */}
            <div className="my-3">
              <label
                htmlFor="ttnAppID"
                className="txt-base block font-bold tracking-normal"
              >
                TTN Application ID
              </label>

              <div className="mt-1">
                <input
                  id="ttnAppID"
                  autoFocus={true}
                  name="ttnAppID"
                  type="text"
                  className="w-full rounded border border-gray-200 px-2 py-1 text-base"
                />
              </div>
            </div>

            {/* TTN Device ID */}
            <div className="my-3">
              <label
                htmlFor="ttnDeID"
                className="txt-base block font-bold tracking-normal"
              >
                TTN Device ID
              </label>

              <div className="mt-1">
                <input
                  id="ttnDeID"
                  autoFocus={true}
                  name="ttnDeID"
                  type="text"
                  className="w-full rounded border border-gray-200 px-2 py-1 text-base"
                />
              </div>
            </div>

            {/* Decoding Options */}
            <div className="my-2">
              <label
                htmlFor="decOptions"
                className="txt-base block font-bold tracking-normal"
              >
                Decoding Options
              </label>

              <div className="mt-1">
                <textarea
                  id="decOptions"
                  name="decOptions"
                  disabled
                  className="w-full rounded border border-gray-200 px-2 py-1 text-base disabled:cursor-not-allowed disabled:bg-[#eee]"
                />
              </div>
            </div>

            {/* Port */}
            <div className="my-3">
              <label
                htmlFor="port"
                className="txt-base block font-bold tracking-normal"
              >
                Port (optional)
              </label>

              <div className="mt-1">
                <input
                  id="port"
                  autoFocus={true}
                  name="port"
                  type="number"
                  className="w-full rounded border border-gray-200 px-2 py-1 text-base"
                  min={1}
                  max={65535}
                />
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ErrorMessage />
    </div>
  );
}
