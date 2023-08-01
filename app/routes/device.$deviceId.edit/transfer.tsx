import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { getUserId } from "~/session.server";
import { Info } from "lucide-react";

//*****************************************************
export async function loader({ request, params }: LoaderArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  return "";
}

//*****************************************************
export async function action({ request, params }: ActionArgs) {
  return "";
}

//**********************************
export default function EditBoxTransfer() {
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
                  <h1 className=" text-4xl">Transfer</h1>
                </div>
              </div>
            </div>

            {/* divider */}
            <hr className="my-3 mt-6 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

            <div className="my-5 rounded border border-[#faebcc] bg-[#fcf8e3] p-4 text-[#8a6d3b]">
              <p className="inline-flex my-1">
                <Info className=" mr-1 inline h-5 w-5 align-sub" />
                Transfer this device to another user!
              </p>
              <hr className="border-[#f7e1b5] my-4" />
              <p className=" my-1">
                To perform the transfer, enter the name below and click the button. A <b>token</b> will be displayed. You pass this <b>token</b> to the new owner. The new owner has to enter the token in his account and click on <b>Claim device</b>. After that the device will be transferred to the new account. 
                <br />
                <br />
                The transfer may be delayed until the new owner has entered the <b>token</b>.
              </p>
            </div>

            {/* Expiration */}
            <div>
              <label
                htmlFor="expiration"
                className="txt-base block font-bold tracking-normal"
              >
                Expiration
              </label>

              <div className="mt-1">
                <select
                  id="expiration"
                  name="expiration"
                  className="appearance-auto w-full rounded border border-gray-200 px-2 py-1.5 text-base"
                >
                  <option value="1">1 day</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>
            </div>

            {/* Type */}
            <div className="my-3">
              <label
                htmlFor="type"
                className="txt-base block font-bold tracking-normal"
              >
                Type 321 heiss v1 10 to confirm.
              </label>

              <div className="mt-1">
                <input
                  id="type"
                  autoFocus={true}
                  name="type"
                  type="text"
                  className="w-full rounded border border-gray-200 px-2 py-1 text-base"
                />
              </div>
            </div>

            {/* Transfer button */}
            <button
              type="button"
              disabled
              className="my-4 block w-full rounded-[3px]
                                border-[#d43f3a] bg-[#d9534f] px-[12px] py-[6px] text-[14px] leading-[1.6] text-[#fff]
                                hover:border-[#ac2925] hover:bg-[#c9302c] disabled:cursor-not-allowed disabled:opacity-70"
            >
              I understand, transfer this device.
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
