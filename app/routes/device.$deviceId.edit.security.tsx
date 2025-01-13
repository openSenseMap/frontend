import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect , Form } from "react-router";
import { getUserId } from "~/utils/session.server";
import { RefreshCw, Save } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import ErrorMessage from "~/components/error-message";

//*****************************************************
export async function loader({ request, params }: LoaderFunctionArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  return "";
}

//*****************************************************
export async function action({ request, params }: ActionFunctionArgs) {
  return "";
}

//**********************************
export default function EditBoxSecurity() {
  const [tokenVisibility, setTokenvisibility] = useState(false);

  return (
    (<div className="grid grid-rows-1">
      <div className="flex min-h-full items-center justify-center">
        <div className="mx-auto w-full font-helvetica text-[14px]">
          {/* Form */}
          <Form method="post" noValidate>
            {/* Heading */}
            <div>
              {/* Title */}
              <div className="mt-2 flex justify-between">
                <div>
                  <h1 className=" text-4xl">Change security settings</h1>
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
                DANGER: If you deactivate this option everyone can send data to
                your senseBox.
              </p>
            </div>

            <div className="my-6 flex items-center space-x-2">
              <Checkbox id="enableAuth" />
              <label
                htmlFor="enableAuth"
                className="cursor-pointer text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Enable authentication
              </label>
            </div>

            {/* Access Token */}
            <div>
              <label htmlFor="Access Token" className="font-bold">
                Access Token
              </label>
              <div className="mt-1 flex">
                <span>
                  <button
                    className="btn btn-default w-12 rounded-br-none rounded-tr-none"
                    onClick={() => setTokenvisibility(!tokenVisibility)}
                    type="button"
                  >
                    {tokenVisibility ? (
                      /* closed eye */
                      (<svg
                        className="w-5.5 h-5 text-gray-700"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 640 512"
                      >
                        <path
                          fill="currentColor"
                          d="M320 400c-75.85 0-137.25-58.71-142.9-133.11L72.2 185.82c-13.79 17.3-26.48 35.59-36.72 55.59a32.35 32.35 0 0 0 0 29.19C89.71 376.41 197.07 448 320 448c26.91 0 52.87-4 77.89-10.46L346 397.39a144.13 144.13 0 0 1-26 2.61zm313.82 58.1l-110.55-85.44a331.25 331.25 0 0 0 81.25-102.07 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64a308.15 308.15 0 0 0-147.32 37.7L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zm-183.72-142l-39.3-30.38A94.75 94.75 0 0 0 416 256a94.76 94.76 0 0 0-121.31-92.21A47.65 47.65 0 0 1 304 192a46.64 46.64 0 0 1-1.54 10l-73.61-56.89A142.31 142.31 0 0 1 320 112a143.92 143.92 0 0 1 144 144c0 21.63-5.29 41.79-13.9 60.11z"
                        ></path>
                      </svg>)
                    ) : (
                      /* open eye */
                      (<svg
                        className="w-5.5 h-5 text-gray-700"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 576 512"
                      >
                        <path
                          fill="currentColor"
                          d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"
                        ></path>
                      </svg>)
                    )}
                  </button>
                </span>
                <input
                  name="accessToken"
                  id="accessToken"
                  defaultValue="dummy token"
                  className="form-control rounded-bl-none rounded-tl-none  border-l-[0px] border-[#ccc;]"
                  type={tokenVisibility ? "text" : "password"}
                  disabled
                />
              </div>
            </div>

            <div className="my-5 rounded border border-[#faebcc] bg-[#fcf8e3] p-4 text-[#8a6d3b]">
              <p>
                DANGER: If you generate a new token you have to upload a new
                sketch to your senseBox. <b>This step can not be undone.</b>
              </p>
              <br />

              <button className="btn flex items-center space-x-2 bg-[#e9e9ed]">
                <RefreshCw className="mr-2 inline h-4 w-4 align-sub" />
                Generate new Token
              </button>
            </div>

            <div className="my-5 rounded border border-[#bce8f1] bg-[#d9edf7] p-4 text-[#31708f]">
              <p>
                Further information regarding security on openSenseMap can be
                found here (also for TTN and MQTT):
                <a
                  href="https://en.docs.sensebox.de/opensensemap/opensensemap-security/"
                  className="cursor-pointer text-[#4eaf47]"
                >
                  https://en.docs.sensebox.de/opensensemap/opensensemap-security/
                </a>
              </p>
            </div>
          </Form>
        </div>
      </div>
    </div>)
  );
}

export function ErrorBoundary() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ErrorMessage />
    </div>
  );
}
