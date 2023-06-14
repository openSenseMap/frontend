import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import React, { useState } from "react";
import invariant from "tiny-invariant";
import { updateUserlocale, verifyLogin } from "~/models/user.server";
import { deleteUserByEmail } from "~/models/user.server";
import { getUserByEmail } from "~/models/user.server";
import { getUserEmail, getUserId } from "~/session.server";
//* Toast impl.
import * as ToastPrimitive from "@radix-ui/react-toast";
import { clsx } from "clsx";

//*****************************************************
export async function loader({ request }: LoaderArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  //* get user email
  const userEmail = await getUserEmail(request);
  //* load user data
  invariant(userEmail, `Email not found!`);
  const userData = await getUserByEmail(userEmail);
  return json(userData);
}

//*****************************************************
export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const email = formData.get("email");
  const password = formData.get("password");
  const language = formData.get("language");

  if (typeof email !== "string") {
    return json(
      {
        errors: {
          name: null,
          email: "Invalid email",
          password: null,
        },
      },
      { status: 400 }
    );
  }

  if (typeof password !== "string") {
    return json(
      {
        errors: {
          name: null,
          email: null,
          password: "Invalid password",
        },
      },
      { status: 400 }
    );
  }

  if (typeof language !== "string" || typeof language !== "string") {
    return json(
      {
        errors: {
          name: null,
          email: null,
          password: null,
        },
      },
      { status: 400 }
    );
  }

  //* if user press delete button
  if (intent === "delete") {
    const user = await verifyLogin(email, password);

    //* if user does't exist
    if (!user) {
      return json(
        {
          errors: {
            name: null,
            email: null,
            password: "Invalid password",
          },
        },
        { status: 400 }
      );
    }

    //* delete user
    await deleteUserByEmail(email);

    //* return error free to show toast msg
    return json(
      {
        errors: {
          name: null,
          email: null,
          password: null,
        },
      },
      { status: 200 }
    );
  } else if (intent === "update") {
    await updateUserlocale(email, language);
  }

  //* won't come to this point.
  return redirect("/");
}

//**********************************
export default function settings() {
  const userData = useLoaderData<typeof loader>(); //* to load user data
  const actionData = useActionData<typeof action>();
  const [passwordVal, setPasswordVal] = useState(""); //* to enable delete account button
  //* Toast notification when user is deleted
  const [toastOpen, setToastOpen] = useState(false);
  //* Toast notification when user is deleted
  const [lang, setLang] = useState(userData?.language);
  //* To focus when an error occured
  const passwordRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    //* when password is not correct
    if (actionData && actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
    //* when password is correct
    if (actionData && !actionData?.errors?.password) {
      // setToastOpen(() => true)
      //* after showing toast msg the page will be reload -> then redirect to home page from loader
      setToastOpen(true);
    }
  }, [actionData]);
  

  return (
    <div className="mt-14">
      <div className="grid grid-rows-1">
        {/*Toast notification */}
        <div>
          <ToastPrimitive.Provider>
            <ToastPrimitive.Root
              open={toastOpen}
              duration={3000}
              onOpenChange={setToastOpen}
              className={clsx(
                "fixed inset-x-4 bottom-4 z-50 w-auto rounded-lg shadow-lg md:top-4 md:right-4 md:left-auto md:bottom-auto md:w-full md:max-w-sm",
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
                  <div className="radix w-full">
                    <ToastPrimitive.Title className=" text-base font-medium text-gray-900 dark:text-gray-100">
                      Account successfully deleted.
                    </ToastPrimitive.Title>
                  </div>
                </div>
              </div>
            </ToastPrimitive.Root>
            <ToastPrimitive.Viewport />
          </ToastPrimitive.Provider>
        </div>

        {/* Setting form */}
        <div className="flex min-h-full items-center justify-center">
          <div className="mx-auto w-full max-w-5xl font-helvetica">
            {/* Heading */}
            <div className="inline-flex">
              {/* avatar icon */}
              <div className="h-12 w-12 overflow-hidden rounded-full leading-4">
                <svg
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              </div>
              {/* Account title */}
              <div>
                <h1 className="mt-2 text-4xl">Account</h1>
              </div>
            </div>

            {/* divider */}
            <hr className="my-2 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

            {/* Form */}
            <div className="pt-4">
              <Form method="post" className="space-y-6" noValidate>
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="txt-base block font-bold tracking-normal"
                  >
                    Name
                  </label>

                  <div className="mt-1">
                    <input
                      id="name"
                      required
                      autoFocus={true}
                      name="name"
                      type="text"
                      readOnly={true}
                      defaultValue={userData?.name}
                      aria-describedby="name-error"
                      className="w-full rounded border border-gray-200 px-2 py-1 text-base"
                    />
                  </div>
                </div>

                {/* Email address */}
                <div>
                  <label
                    htmlFor="email"
                    className="txt-base block font-bold tracking-normal"
                  >
                    Email address
                  </label>

                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      readOnly={true}
                      defaultValue={userData?.email}
                      aria-describedby="email-error"
                      className="w-full rounded border border-gray-200 px-2 py-1 text-base"
                    />
                  </div>
                </div>

                {/* Email confirmation status */}
                <div className="mt-1 text-sm">
                  {userData?.emailIsConfirmed ? (
                    <span className="mr-2 rounded-full bg-[#4eaf47] px-2.5 py-1 text-sm font-semibold text-white dark:bg-green-900 dark:text-green-300">
                      Email address is confirmed!
                    </span>
                  ) : (
                    <span className="dark:bg-red-900 dark:text-red-300 mr-2 rounded-full bg-[#e77817] px-2.5 py-1 text-sm font-medium text-white">
                      Email address is not confirmed!
                    </span>
                  )}
                </div>

                {/* divider */}
                <hr className="my-2 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

                {/* Language */}
                <div>
                  <label
                    htmlFor="language"
                    className="txt-base block font-bold tracking-normal"
                  >
                    Language
                  </label>

                  <div className="mt-1">
                    <select
                      id="language"
                      name="language"
                      defaultValue={userData?.language}
                      onChange={(e) => setLang(e.target.value)}
                      className="appearance-auto w-full rounded border border-gray-200 px-2 py-1.5 text-base"
                    >
                      <option value="en_US">English</option>
                      <option value="de_DE">Deutsch</option>
                    </select>
                  </div>
                </div>

                {/* Change password */}
                <div>
                  <label
                    htmlFor="language"
                    className="txt-base block font-bold tracking-normal"
                  >
                    Password
                  </label>

                  <div className="mt-1">
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 26 26"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <a
                        href="/account/settings/changepassword"
                        className=" ml-2 font-semibold text-[#4eaf47] hover:underline"
                      >
                        Change Password
                      </a>
                    </div>
                  </div>
                </div>

                {/* divider */}
                <hr className="my-2 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

                {/* Password */}
                <div>
                  <label
                    htmlFor="email"
                    className="txt-base block font-bold tracking-normal"
                  >
                    Password
                  </label>

                  <div className="mt-1">
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      placeholder="Password"
                      // defaultValue={123}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-base placeholder-[#999]"
                    />
                  </div>
                </div>

                {/* Update button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    name="intent"
                    value="update"
                    disabled={lang === userData?.language}
                    className="rounded border border-gray-200 py-2 px-4 text-black disabled:border-[#ccc] disabled:text-[#8a8989]"
                  >
                    Update
                  </button>
                </div>

                {/* Delete account */}
                <div>
                  <h1 className="mt-2 text-4xl text-[#FF4136]">
                    Delete account
                  </h1>
                </div>
                {/* divider */}
                <hr className="my-2 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />
                <div className="">
                  <p>
                    If you delete your account, all your senseBoxes and
                    measurements will be deleted.
                  </p>
                  <p className="mt-1 mb-0">
                    To delete your account, please type your current password.
                  </p>
                </div>
                <div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Password"
                    ref={passwordRef}
                    // defaultValue={123}
                    className="w-full rounded border border-gray-200 px-2 py-1 text-base placeholder-[#999]"
                    value={passwordVal}
                    onChange={(e) => setPasswordVal(e.target.value)}
                  />
                  {actionData?.errors?.password && (
                    <div className="pt-1 text-[#FF0000]" id="email-error">
                      {actionData.errors.password}
                    </div>
                  )}
                </div>
                {/* Delete button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    name="intent"
                    value="delete"
                    disabled={!passwordVal}
                    className="mb-5 rounded border border-gray-200 py-2 px-4 text-black disabled:border-[#ccc] disabled:text-[#8a8989]"
                  >
                    Delete account
                  </button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
