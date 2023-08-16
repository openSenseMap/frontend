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
import { Separator } from "~/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

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
  const { intent, ...values } = Object.fromEntries(formData);
  const { name, email, passwordUpdate, passwordDelete, language } = values;

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

  return redirect("");
}

//**********************************
export default function AccountPage() {
  const userData = useLoaderData<typeof loader>(); //* to load user data
  const actionData = useActionData<typeof action>();
  const [passwordDelVal, setPasswordVal] = useState(""); //* to enable delete account button
  const [lang, setLang] = useState(userData?.language);
  const [name, setName] = useState(userData?.name);
  //* To focus when an error occured
  const passwordDelRef = React.useRef<HTMLInputElement>(null);
  const passwordUpdRef = React.useRef<HTMLInputElement>(null);
  //* toast
  const { toast } = useToast();

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
      toast({
        title: "Profile succesfully updated.",
        // description: "",
      });
    }
  }, [actionData]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Account</h3>
        <p className="text-sm text-muted-foreground">
          Update your account settings. Set your preferred language and
          timezone.
        </p>
      </div>
      <Separator />
      <div>
        <div className="grid grid-rows-1">
          {/* Setting form */}
          <div className="flex min-h-full items-center justify-center">
            <div className="mx-auto w-full font-helvetica">
              {/* Form */}
              <Form method="post" className="space-y-6" noValidate>
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="txt-base block tracking-normal"
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
                      className="w-full rounded border border-gray-200 px-2 py-1"
                    />
                  </div>
                </div>

                {/* Email address */}
                <div>
                  <label
                    htmlFor="email"
                    className="txt-base block  tracking-normal"
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
                    className="txt-base block  tracking-normal"
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
                    className="txt-base block  tracking-normal"
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
                        href="/settings/account/changepassword"
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
                    className="txt-base block  tracking-normal"
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
  );
}
