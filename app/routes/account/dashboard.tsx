import type { ActionArgs, LoaderArgs} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import React, { useState } from "react";
import { getUserDevices } from "~/models/device.server";
import { getUserId } from "~/session.server";
//* Toast impl.
import * as ToastPrimitive from "@radix-ui/react-toast";
import { clsx } from "clsx";

export async function loader({ request }: LoaderArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  //* get all devices data
  const allDevices = await getUserDevices(userId);

  return json(allDevices);
}

//*****************************************************
export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  //* when claim button is clicked
  if (intent === "claimToken") {
    return json(
      {
        errors: {
          token: "Token was not found",
        },
      },
      { status: 400 }
    );
  }

  //* won't come to this point.
  return redirect("/");
}

//***********************************
export default function Dashboard() {
  //* to load user data
  const devicesData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  //* to enable claim device button
  const [tokendVal, setTokenVal] = useState("");
  //* to enable claim device button when input is not empty
  const tokenRef = React.useRef<HTMLInputElement>(null);
  //* Toast notification when token is not found
  const [toastOpen, setToastOpen] = useState(false);

  React.useEffect(() => {
    //* when token is not found
    if (actionData && actionData?.errors?.token) {
      //* after showing toast msg the page will be reload -> then redirect to home page from loader
      setToastOpen(true);
    }
  }, [actionData]);

  return (
    <div className="mx-8 mt-14">
      <div className="grid grid-flow-col gap-8 font-helvetica tracking-wide max-md:grid-rows-2  lg:grid-rows-1">
        {/* First row - left column, create new sensebox   */}
        <div className=" col-span-6 mb-7">
          <div className=" mb-5 block h-full rounded border-[1px] border-[#ddd] p-1">
            <div className="p-2">
              <p className="mt-5 mb-3 text-2xl">
                You have <b>{devicesData.length}</b> registered senseBoxes!
              </p>

              <p className="mb-[10px]">
                Create a new senseBox by clicking register or check out our
                documentation.
              </p>
              <p className="flex gap-2">
                <a href="/newBox" className="btn btn-primary hover:border-[#204d74] hover:bg-[#286090] hover:text-[#fff]">
                  New senseBox
                </a>
                <a
                  href="https://sensebox.de/de/go-home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-default hover:border-[#adadad] hover:bg-[#e6e6e6] hover:text-[#333]"
                >
                  Documentation
                </a>
                <a
                  href="https://forum.sensebox.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-default hover:border-[#adadad] hover:bg-[#e6e6e6] hover:text-[#333]"
                  role="button"
                >
                  Forum
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* First row (right column) - claim device   */}
        <div className=" col-span-6 mb-7">
          <div className=" mb-5 block h-full rounded border-[1px] border-[#ddd] p-1">
            <div className="p-2">
              <p className="mt-5 mb-3 text-2xl">
                Du möchtest ein Gerät von einem anderen Benutzer übernehmen?
              </p>
              {/* Form */}
              <form method="post">
                <div>
                  <label htmlFor="name" className="font-semibold">
                    Gib hier den <kbd className="kbd">Token</kbd> ein, den du
                    bekommen hast:
                  </label>

                  <div className=" relative table border-separate">
                    <input
                      id="token"
                      name="token"
                      type="text"
                      ref={tokenRef}
                      maxLength={12}
                      className="form-control rounded-tr-[0px] rounded-br-[0px] placeholder:text-[#999] placeholder:opacity-100"
                      value={tokendVal}
                      onChange={(e) => setTokenVal(e.target.value)}
                      placeholder="Token"
                    />
                    <span className="input-group-btn">
                      <button
                        type="submit"
                        name="intent"
                        value="claimToken"
                        className="btn btn-primary rounded-tl-[0px] rounded-bl-[0px] disabled:opacity-[.65]"
                        disabled={!tokendVal}
                      >
                        Claim device
                      </button>
                    </span>
                  </div>
                </div>
              </form>
              {/*Toast notification */}
              <div className="mb-8">
                <ToastPrimitive.Provider>
                  <ToastPrimitive.Root
                    open={toastOpen}
                    duration={10000}
                    onOpenChange={setToastOpen}
                    className={clsx(
                      "inset-x-4 bottom-4 z-50 w-auto rounded-lg shadow-lg md:top-4 md:right-4 md:left-auto md:bottom-auto md:w-full",
                      " mt-8 bg-[#f2dede] pr-3 text-[#a94442]  dark:bg-gray-800",
                      "radix-state-open:animate-toast-slide-in-bottom md:radix-state-open:animate-toast-slide-in-right",
                      "radix-state-closed:animate-toast-hide",
                      "radix-swipe-direction-right:radix-swipe-end:animate-toast-swipe-out-x",
                      "radix-swipe-direction-right:translate-x-radix-toast-swipe-move-x",
                      "radix-swipe-direction-down:radix-swipe-end:animate-toast-swipe-out-y",
                      "radix-swipe-direction-down:translate-y-radix-toast-swipe-move-y",
                      "radix-swipe-cancel:translate-x-0 radix-swipe-cancel:duration-200 radix-swipe-cancel:ease-[ease]",
                      "focus-visible:ring-purple-500 focus:outline-none focus-visible:ring focus-visible:ring-opacity-75"
                    )}
                  >
                    <div className="flex">
                      <div className="flex w-0 flex-1 items-center py-4 pl-5">
                        <div className="radix mr-3 w-full">
                          <ToastPrimitive.Title className=" flex justify-between text-base font-medium  text-gray-900 dark:text-gray-100">
                            Token was not found
                            <ToastPrimitive.Close aria-label="Close">
                              <span aria-hidden>×</span>
                            </ToastPrimitive.Close>
                          </ToastPrimitive.Title>
                        </div>
                      </div>
                    </div>
                    {/* <ToastPrimitive.Close>Dismiss</ToastPrimitive.Close> */}
                  </ToastPrimitive.Root>
                  <ToastPrimitive.Viewport />
                </ToastPrimitive.Provider>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Second row - show devices data */}
      <div className=" ">
        <div className="py-8">
          <div>
            <h2 className="text-2xl font-semibold leading-tight">
              List of senseBoxes
            </h2>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 py-4 sm:-mx-8 sm:px-8">
            <div className="inline-block min-w-full overflow-hidden rounded-lg shadow">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr className="">
                    <th className="border-b-2 border-gray-200 bg-[#b3e0f2] py-3 pl-5 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
                      Name
                    </th>
                    <th className="border-b-2 border-gray-200 bg-[#b3e0f2]  py-3 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
                      Exposure
                    </th>
                    <th className="border-b-2 border-gray-200 bg-[#b3e0f2]  py-3 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
                      Model
                    </th>
                    <th className="border-b-2 border-gray-200 bg-[#b3e0f2]  py-3 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
                      senseBox ID
                    </th>
                    <th className="border-b-2 border-gray-200 bg-[#b3e0f2] px-5 py-3 text-left text-sm font-semibold uppercase tracking-wider text-gray-600">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {devicesData.map((deviceData) => (
                    <tr key={deviceData.id}>
                      <td className="border-b border-gray-200 bg-white  py-3 pl-5 text-sm">
                        <div className="flex items-center">
                          <div className="">
                            <p className="whitespace-no-wrap text-gray-900">
                              {deviceData.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-gray-200 bg-white  py-5 text-sm">
                        <p className="whitespace-no-wrap text-gray-900">
                          {deviceData.exposure}
                        </p>
                      </td>
                      <td className="border-b border-gray-200 bg-white  py-5 text-sm">
                        <p className="whitespace-no-wrap text-gray-900">
                          {deviceData.model}
                        </p>
                      </td>
                      <td className="border-b border-gray-200 bg-white  py-5 text-sm">
                        <p className="whitespace-no-wrap text-gray-900">
                          {deviceData.id}
                        </p>
                      </td>
                      <td className="border-b border-gray-200 bg-white px-5 py-3 text-sm">
                        <a
                          href={`/explore/${deviceData.id}`}
                          className="btn btn-default rounded-tr-none rounded-br-none text-[#000]  hover:border-[#adadad] hover:bg-[#e6e6e6] hover:text-[#333]"
                        >
                          Show
                        </a>
                        <a
                          href="https://sensebox.de/de/go-home"
                          className="btn btn-default rounded-bl-none rounded-tl-none rounded-tr-none rounded-br-none text-[#000]  hover:border-[#adadad] hover:bg-[#e6e6e6] hover:text-[#333]"
                        >
                          Edit
                        </a>
                        <a
                          href="https://sensebox.de/de/go-home"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-default rounded-bl-none rounded-tl-none rounded-tr-none rounded-br-none text-[#000]  hover:border-[#adadad] hover:bg-[#e6e6e6] hover:text-[#333]"
                        >
                          Data upload
                        </a>
                        <a
                          href="https://sensebox.de/de/go-home"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-default rounded-bl-none rounded-tl-none text-[#000]  hover:border-[#adadad] hover:bg-[#e6e6e6] hover:text-[#333]"
                        >
                          support
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
