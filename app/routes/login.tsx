import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { data, redirect , Form, Link, useActionData, useSearchParams } from "react-router";
import * as React from "react";
import ErrorMessage from "~/components/error-message";
import { NavBar } from "~/components/nav-bar";

import { verifyLogin } from "~/models/user.server";
import { createUserSession, getUserId } from "~/utils/session.server";
import { safeRedirect, validateEmail } from "~/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  //* check session if a user is already logged in
  const userId = await getUserId(request);
  if (userId) return redirect("/"); //* redirect to home page
  return {}; //* remain in login page
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/");
  const remember = formData.get("remember");

  //* validate email
  if (!validateEmail(email)) {
    return data(
      { errors: { email: "Email is invalid", password: null } },
      { status: 400 },
    );
  }

  //* validate password
  if (typeof password !== "string" || password.length === 0) {
    return data(
      { errors: { password: "Password is required", email: null } },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return data(
      {
        errors: { password: "Please use at least 8 characters.", email: null },
      },
      { status: 400 },
    );
  }

  const user = await verifyLogin(email, password);

  if (!user) {
    return data(
      { errors: { email: "Invalid email or password", password: null } },
      { status: 400 },
    );
  }

  return createUserSession({
    request,
    userId: user.id,
    remember: remember === "on" ? true : false,
    redirectTo,
  });
}

export const meta: MetaFunction = () => {
  return [{ title: "Login" }];
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  //* Redirect to main page after login
  const redirectTo = searchParams.get("redirectTo") || "/";
  const actionData = useActionData<typeof action>();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div className="flex flex-col h-screen">
      <NavBar />
      <div className="flex h-full w-full justify-center py-10">
        <div className="w-full flex items-center justify-center h-full max-w-3xl rounded-lg p-6 dark:shadow-none dark:bg-transparent dark:text-dark-text">
          <Form method="post" className="space-y-6" noValidate>
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
                  autoComplete="current-password"
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
              Log in
            </button>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="text-blue-600 h-4 w-4 rounded border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>
              <div className="text-center text-sm text-gray-500">
                Don't have an account?{" "}
                <Link
                  className="text-blue-500 underline"
                  to={{
                    pathname: "/join",
                    search: searchParams.toString(),
                  }}
                >
                  Sign up
                </Link>
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
    <div className="h-screen w-screen flex items-center justify-center">
      <ErrorMessage />
    </div>
  );
}
