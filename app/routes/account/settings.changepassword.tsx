import { Form, useActionData } from "@remix-run/react";
import { LoaderArgs } from "@remix-run/server-runtime";
import { ActionArgs, json, redirect } from "@remix-run/node";
import { getUserEmail, getUserId, logout } from "~/session.server";
import React, { useState } from "react";
import {
  validatePassLength,
  validatePassType as validatePassType,
} from "~/utils";
import { updateUserPassword, verifyLogin } from "~/models/user.server";
import invariant from "tiny-invariant";
//* Toast impl.
import * as ToastPrimitive from "@radix-ui/react-toast";
import { clsx } from "clsx";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

//*****************************************************
export async function loader({ request }: LoaderArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");
  return json({});
}

//*****************************************************
export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const currPass = formData.get("currentPassword");
  const newPass = formData.get("newPassword");
  const confirmPass = formData.get("newPasswordConfirm");
  const passwordsList = [currPass, newPass, confirmPass];

  //* when cancel button is clicked
  if (intent === "cancel") {
    return redirect("/account/settings");
  }

  //* validate passwords type
  const checkPasswordsType = validatePassType(passwordsList);
  if (!checkPasswordsType.isValid) {
    return json(
      {
        errors: {
          currPass:
            checkPasswordsType.index == 0
              ? "Current password is required."
              : null,
          newPass:
            checkPasswordsType.index == 1 ? "New password is required." : null,
          confirmPass:
            checkPasswordsType.index == 2
              ? "Password confirmation is required."
              : null,
          passMatch: null,
        },
      },
      { status: 400 }
    );
  }

  //* validate passwords lenghts
  const validatePasswordsLength = validatePassLength(passwordsList);
  if (!validatePasswordsLength.isValid) {
    return json(
      {
        errors: {
          currPass:
            validatePasswordsLength.index == 0
              ? "Please use at least 8 characters."
              : null,
          newPass:
            validatePasswordsLength.index == 1
              ? "Please use at least 8 characters."
              : null,
          confirmPass:
            validatePasswordsLength.index == 2
              ? "Please use at least 8 characters."
              : null,
          passMatch: null,
        },
      },
      { status: 400 }
    );
  }

  //* get user email
  const userEmail = await getUserEmail(request);
  invariant(userEmail, `Email not found!`);

  //* validate password
  if (typeof currPass !== "string" || currPass.length === 0) {
    return json(
      {
        errors: {
          currPass: "Password is required.",
          newPass: null,
          confirmPass: null,
          passMatch: null,
        },
      },
      { status: 400 }
    );
  }

  //* check both new passwords match
  if (newPass !== confirmPass) {
    return json(
      {
        errors: {
          currPass: null,
          newPass: null,
          confirmPass: null,
          passMatch: "Please make sure your passwords match.",
        },
      },
      { status: 400 }
    );
  }

  //* check user password is correct
  const user = await verifyLogin(userEmail, currPass);

  if (!user) {
    return json(
      {
        errors: {
          currPass: "Incorrect password.",
          newPass: null,
          confirmPass: null,
          passMatch: null,
        },
      },
      { status: 400 }
    );
  }

  //* get user ID
  const userId = await getUserId(request);
  invariant(userId, `userId not found!`);

  if (typeof newPass !== "string" || newPass.length === 0) {
    return json(
      {
        errors: {
          currPass: "Password is required.",
          newPass: null,
          confirmPass: null,
          passMatch: null,
        },
      },
      { status: 400 }
    );
  }

  //* update user password
  await updateUserPassword(userId, newPass);

  //* logout
  return logout({request: request, redirectTo: "/explore"});
}

//****************************************
export default function Changepassword() {
  const actionData = useActionData<typeof action>();

  //* Toast notification when user is deleted
  const [toastOpen, setToastOpen] = useState(false);

  const currPassRef = React.useRef<HTMLInputElement>(null);
  const newPassRef = React.useRef<HTMLInputElement>(null);
  const confirmPassRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.currPass) {
      currPassRef.current?.focus();
    } else if (actionData?.errors?.newPass) {
      newPassRef.current?.focus();
    } else if (actionData?.errors?.confirmPass) {
      confirmPassRef.current?.focus();
    } else if (actionData?.errors?.passMatch) {
      newPassRef.current?.focus();
      setToastOpen(true);
    }
  }, [actionData]);

  return (
    <div className="mt-14">
      <div className="grid grid-rows-1">
        <div className="flex min-h-full items-center justify-center">
          <div className="mx-auto w-full max-w-5xl font-helvetica">
            {/*Toast notification */}
            <div className="mb-12">
              <ToastPrimitive.Provider>
                <ToastPrimitive.Root
                  open={toastOpen}
                  duration={3000}
                  onOpenChange={setToastOpen}
                  className={clsx(
                    "inset-x-4 bottom-4 z-50 w-auto rounded-lg shadow-lg md:top-4 md:right-4 md:left-auto md:bottom-auto md:w-full",
                    "bg-[#d9edf7] dark:bg-gray-800",
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
                          {actionData?.errors?.passMatch}
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

            {/* Heading */}
            <div className="inline-flex">
              {/* avatar icon */}
              <div className="h-9 w-9 rotate-[270deg] overflow-hidden rounded-full leading-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M15.75 1.5a6.75 6.75 0 00-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a3 3 0 00-.878 2.121v2.818c0 .414.336.75.75.75H6a.75.75 0 00.75-.75v-1.5h1.5A.75.75 0 009 19.5V18h1.5a.75.75 0 00.53-.22l2.658-2.658c.19-.189.517-.288.906-.22A6.75 6.75 0 1015.75 1.5zm0 3a.75.75 0 000 1.5A2.25 2.25 0 0118 8.25a.75.75 0 001.5 0 3.75 3.75 0 00-3.75-3.75z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              {/* Change password title */}
              <div>
                <h1 className="ml-2 text-4xl">Change Password</h1>
              </div>
            </div>

            {/* divider */}
            <hr className="my-2 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

            {/* Form */}
            <div className="pt-4">
              <Form method="post" className="space-y-6" noValidate>
                {/* Password */}
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-base font-bold tracking-normal"
                  >
                    Current password
                  </label>

                  <div className="mt-1">
                    <input
                      ref={currPassRef}
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      placeholder="Current Password"
                      // defaultValue={123}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-base placeholder-[#999]"
                    />
                    {actionData?.errors?.currPass && (
                      <div className="pt-1 text-[#FF0000]" id="currPass-error">
                        {actionData.errors.currPass}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="txt-base block font-bold tracking-normal"
                  >
                    New password
                  </label>

                  <div className="mt-1">
                    <input
                      ref={newPassRef}
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      placeholder="New Password"
                      // defaultValue={123}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-base placeholder-[#999]"
                    />
                    {actionData?.errors?.newPass && (
                      <div className="pt-1 text-[#FF0000]" id="newPass-error">
                        {actionData.errors.newPass}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="newPasswordConfirm"
                    className="txt-base block font-bold tracking-normal"
                  >
                    Confirm new password
                  </label>

                  <div className="mt-1">
                    <input
                      ref={confirmPassRef}
                      id="newPasswordConfirm"
                      name="newPasswordConfirm"
                      type="password"
                      placeholder="New Password Confirm"
                      // defaultValue={123}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-base placeholder-[#999]"
                    />
                    {actionData?.errors?.confirmPass && (
                      <div
                        className="pt-1 text-[#FF0000]"
                        id="confirmPass-error"
                      >
                        {actionData.errors.confirmPass}
                      </div>
                    )}
                  </div>
                </div>

                {/* divider */}
                <hr className="my-2 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

                {/* Cancel and Update buttons */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    name="intent"
                    value="cancel"
                    disabled={false}
                    className="rounded border border-gray-200 py-2 px-4 text-black disabled:border-[#ccc] disabled:text-[#8a8989]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    name="intent"
                    value="update"
                    disabled={false}
                    className="ml-3 rounded border border-gray-200 py-2 px-4 text-black disabled:border-[#ccc]  disabled:text-[#8a8989]"
                  >
                    Update
                  </button>
                </div>

                {/* ui.shadcn.com components */}
                {/* <div className="grid w-full gap-2">
                  <Label
                    htmlFor="newPasswordConfirm"
                    className="block text-base font-bold tracking-normal"
                  >
                    Confirm new password
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    placeholder="New Password Confirm"
                    className="rounded border border-gray-200 px-2 py-1 text-base placeholder-[#999]"
                  />
                </div> */}

              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
