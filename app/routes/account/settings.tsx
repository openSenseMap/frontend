import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import React, { useState } from "react";
import invariant from "tiny-invariant";
import {
  updateUserName,
  updateUserlocale,
  verifyLogin,
  deleteUserByEmail,
  getUserByEmail,
} from "~/models/user.server";
import { getUserEmail, getUserId } from "~/session.server";
//* Toast impl.
import * as ToastPrimitive from "@radix-ui/react-toast";
import { clsx } from "clsx";
import Home from "~/components/header/home";

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
  const { intent, name, email, passwordUpdate, passwordDelete, language } =
    Object.fromEntries(formData);

  const errors = {
    name: name ? null : "Invalid name",
    email: email ? null : "Invalid email",
    passwordUpdate: passwordUpdate ? null : "Password is required",
    passwordDelete: passwordDelete ? null : "Password is required",
  };

  /* const hasErrors = Object.values(errors).some((errorMessage) => errorMessage);
  if (hasErrors) {
    return json({ errors: errors, status: 400 });
  } */

  invariant(typeof name === "string", "name must be a string");
  invariant(typeof email === "string", "email must be a string");
  invariant(typeof passwordUpdate === "string", "password must be a string");
  invariant(typeof passwordDelete === "string", "password must be a string");
  invariant(typeof language === "string", "language must be a string");

  //* check button intent
  switch (intent) {
    case "update": {
      //* check password validaty
      if (errors.passwordUpdate) {
        return json({
          errors: {
            name: null,
            email: null,
            passwordUpdate: errors.passwordUpdate,
            passwordDelete: null,
          },
          intent: intent,
          status: 400,
        });
      }

      const user = await verifyLogin(email, passwordUpdate);
      //* if entered password is invalid
      if (!user) {
        return json(
          {
            errors: {
              name: null,
              email: null,
              passwordUpdate: "Invalid password",
              passwordDelete: null,
            },
            intent: intent,
          },
          { status: 400 }
        );
      }

      await updateUserlocale(email, language);

      await updateUserName(email, name);

      //* user name shouldn't be unique
      //* check if user exists by name before updating user name
      /* const existingUserByName = await getUserByName(name);
      if(!existingUserByName){
        await updateUserName(email, name);
      } */

      //* return error free to show toast msg
      return json(
        {
          errors: {
            name: null,
            email: null,
            passwordUpdate: null,
            passwordDelete: null,
            passwordDe: null,
          },
          intent: intent,
        },
        { status: 200 }
      );
    }

    case "delete": {
      const user = await verifyLogin(email, passwordDelete);

      //* if entered password is invalid
      if (!user) {
        return json(
          {
            errors: {
              name: null,
              email: null,
              passwordUpdate: null,
              passwordDelete: "Invalid password",
            },
            intent: intent,
          },
          { status: 400 }
        );
      }

      //* delete user
      await deleteUserByEmail(email);
    }
  }

  return redirect("/");
}

//**********************************
export default function Settings() {
  const userData = useLoaderData<typeof loader>(); //* to load user data
  const actionData = useActionData<typeof action>();
  const [passwordDelVal, setPasswordVal] = useState(""); //* to enable delete account button
  //* Toast notification when user is deleted
  const [toastOpen, setToastOpen] = useState(false);
  const [lang, setLang] = useState(userData?.language);
  const [name, setName] = useState(userData?.name);
  //* To focus when an error occured
  const passwordDelRef = React.useRef<HTMLInputElement>(null);
  const passwordUpdRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    //* when password is not correct
    if (actionData && actionData?.errors?.passwordDelete) {
      passwordDelRef.current?.focus();
    } else if (actionData && actionData?.errors?.passwordUpdate) {
      passwordUpdRef.current?.focus();
    }
    //* when passwordUpdate is correct
    if (
      actionData &&
      !actionData?.errors?.passwordUpdate &&
      actionData?.intent === "update"
    ) {
      setToastOpen(true);
      window.scrollTo(0, 0);
    }
  }, [actionData]);

  return (
    <div>
      <div className="pointer-events-none z-10 mb-10 flex h-14 w-full p-2">
        <Home />
      </div>

      <div className="mt-14">
        <div className="grid grid-rows-1">
          {/* Setting form */}
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
                      " inset-x-4 bottom-4 z-50 w-auto rounded-lg shadow-lg md:bottom-auto md:left-auto md:right-4 md:top-4 md:w-full",
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
                      <div className="flex w-0 flex-1 items-center p-4">
                        <div className="radix w-full">
                          <ToastPrimitive.Title className=" flex justify-between text-base font-medium  text-[#31708f] dark:text-gray-100">
                            {/* Account successfully deleted. */}
                            Profile succesfully updated.
                            <ToastPrimitive.Close aria-label="Close">
                              <span aria-hidden>×</span>
                            </ToastPrimitive.Close>
                          </ToastPrimitive.Title>
                        </div>
                      </div>
                    </div>
                  </ToastPrimitive.Root>
                  <ToastPrimitive.Viewport />
                </ToastPrimitive.Provider>
              </div>
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
                        defaultValue={userData?.name}
                        onChange={(e) => setName(e.target.value)}
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
                        id="passwordUpdate"
                        name="passwordUpdate"
                        type="password"
                        placeholder="Password"
                        ref={passwordUpdRef}
                        className="w-full rounded border border-gray-200 px-2 py-1 text-base placeholder-[#999]"
                      />
                      {actionData?.errors?.passwordUpdate && (
                        <div className="pt-1 text-[#FF0000]" id="email-error">
                          {actionData.errors.passwordUpdate}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Update button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      name="intent"
                      value="update"
                      disabled={
                        lang === userData?.language && name === userData?.name
                      }
                      className="rounded border border-gray-200 px-4 py-2 text-black disabled:border-[#ccc] disabled:text-[#8a8989]"
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
                    <p className="mb-0 mt-1">
                      To delete your account, please type your current password.
                    </p>
                  </div>
                  <div>
                    <input
                      id="passwordDelete"
                      name="passwordDelete"
                      type="password"
                      placeholder="Password"
                      ref={passwordDelRef}
                      // defaultValue={123}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-base placeholder-[#999]"
                      value={passwordDelVal}
                      onChange={(e) => setPasswordVal(e.target.value)}
                    />
                    {actionData?.errors?.passwordDelete && (
                      <div className="pt-1 text-[#FF0000]" id="email-error">
                        {actionData.errors.passwordDelete}
                      </div>
                    )}
                  </div>
                  {/* Delete button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      name="intent"
                      value="delete"
                      disabled={!passwordDelVal}
                      className="mb-5 rounded border border-gray-200 px-4 py-2 text-black disabled:border-[#ccc] disabled:text-[#8a8989]"
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
    </div>
  );
}
