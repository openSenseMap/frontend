import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { data, redirect , Form, Link, useActionData, useSearchParams } from "react-router";
import * as React from "react";

import { createUserSession, getUserId } from "~/session.server";

import { createUser, getUserByEmail } from "~/models/user.server";
import { safeRedirect, validateEmail, validateName } from "~/utils";
import i18next from "app/i18next.server";
import ErrorMessage from "~/components/error-message";
import { getProfileByUsername } from "~/models/profile.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return {};
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const name = formData.get("name");

  const redirectTo = safeRedirect(formData.get("redirectTo"), "/");

  if (!name || typeof name !== "string") {
    return data(
      { errors: { name: "Name is required", email: null, password: null } },
      { status: 400 },
    );
  }

  //* Validate userName
  const validateUserName = validateName(name?.toString());
  if (!validateUserName.isValid) {
    return data(
      {
        errors: {
          name: validateUserName.errorMsg,
          password: null,
          email: null,
        },
      },
      { status: 400 },
    );
  }

  if (!validateEmail(email)) {
    return data(
      { errors: { name: null, email: "Email is invalid", password: null } },
      { status: 400 },
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return data(
      { errors: { name: null, email: null, password: "Password is required" } },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return data(
      {
        errors: {
          name: null,
          email: null,
          password: "Please use at least 8 characters.",
        },
      },
      { status: 400 },
    );
  }

  //* check if user exists by email
  const existingUserByEmail = await getUserByEmail(email);
  if (existingUserByEmail) {
    return data(
      {
        errors: {
          name: null,
          email: "A user already exists with this email",
          password: null,
        },
      },
      { status: 400 },
    );
  }

  // check if profile exists by name
  const existingUserByName = await getProfileByUsername(name);
  if (existingUserByName) {
    return data(
      {
        errors: {
          name: "A user already exists with this name",
          email: null,
          password: null,
        },
      },
      { status: 400 },
    );
  }

  //* get current locale
  const locale = await i18next.getLocale(request);
  const language = locale === "de" ? "de_DE" : "en_US";

  const user = await createUser(name, email, language, password);

  return createUserSession({
    request,
    userId: user[0].id,
    remember: false,
    redirectTo,
  });
}

export const meta: MetaFunction = () => {
  return [{ title: "Sign Up" }];
};

export default function Join() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const actionData = useActionData<typeof action>();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const nameRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div className="flex h-screen min-h-full flex-col items-center justify-center">
      {/* Form */}
      <div className="mx-auto w-full max-w-md px-8">
        <Form method="post" className="space-y-6" noValidate>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <div className="mt-1">
              <input
                ref={nameRef}
                id="name"
                required
                autoFocus={true}
                name="name"
                type="text"
                autoComplete="name"
                aria-invalid={actionData?.errors?.name ? true : undefined}
                aria-describedby="name-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.errors?.name && (
                <div className="pt-1 text-[#FF0000]" id="email-error">
                  {actionData.errors.name}
                </div>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <div className="mt-1">
              <input
                ref={emailRef}
                id="email"
                required
                autoFocus={true}
                name="email"
                type="email"
                autoComplete="email"
                aria-invalid={actionData?.errors?.email ? true : undefined}
                aria-describedby="email-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.errors?.email && (
                <div className="pt-1 text-[#FF0000]" id="email-error">
                  {actionData.errors.email}
                </div>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                ref={passwordRef}
                name="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={actionData?.errors?.password ? true : undefined}
                aria-describedby="password-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.errors?.password && (
                <div className="pt-1 text-[#FF0000]" id="password-error">
                  {actionData.errors.password}
                </div>
              )}
            </div>
          </div>

          <input type="hidden" name="redirectTo" value={redirectTo} />
          <button
            type="submit"
            className="hover:bg-blue-600 focus:bg-blue-400 w-full  rounded bg-blue-500 px-4 py-2 text-white"
          >
            Create Account
          </button>
          <div className="flex items-center justify-center">
            <div className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                className="text-[#FF0000] underline"
                to={{
                  pathname: "/login",
                  search: searchParams.toString(),
                }}
              >
                Log in
              </Link>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <ErrorMessage />
    </div>
  );
}
