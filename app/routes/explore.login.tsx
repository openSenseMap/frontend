import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { verifyLogin } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect, validateEmail } from "~/utils";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Spinner from "~/components/spinner";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/");
  const remember = formData.get("remember");

  if (!validateEmail(email)) {
    return json(
      { errors: { email: "Email is invalid", password: null } },
      { status: 400 },
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return json(
      { errors: { password: "Password is required", email: null } },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return json(
      { errors: { password: "Password is too short", email: null } },
      { status: 400 },
    );
  }

  const user = await verifyLogin(email, password);

  if (!user) {
    return json(
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
  const redirectTo =
    searchParams.size > 0 ? "/explore?" + searchParams.toString() : "/explore";
  const actionData = useActionData<typeof action>();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  const { t } = useTranslation("login");
  const navigation = useNavigation();
  const isLoggingIn = Boolean(navigation.state === "submitting");

  React.useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div className="flex h-full w-full justify-center">
      <Link
        to={{
          pathname: "/explore",
          search: searchParams.toString(),
        }}
      >
        <div className="fixed inset-0 z-40 h-full w-full bg-black opacity-25" />
      </Link>
      <div
        id="login-modal"
        data-state="open"
        className="fixed top-[20%] z-50 grid h-fit w-full gap-4 rounded-b-lg border bg-background dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95 p-6 shadow-lg animate-in data-[state=open]:fade-in-90 data-[state=open]:slide-in-from-bottom-10 sm:max-w-lg sm:rounded-lg sm:zoom-in-90 data-[state=open]:sm:slide-in-from-bottom-0"
      >
        {navigation.state === "loading" && (
          <div className="bg-white dark:bg-zinc-800 bg-opacity-30 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md">
            <Spinner />
          </div>
        )}
        <span className="pl-5 text-4xl font-medium">{t("login_label")}</span>
        <Link
          to={{
            pathname: "/explore",
            search: searchParams.toString(),
          }}
        >
          <button className="absolute right-3 top-3 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </Link>
        <div className="mx-auto w-full max-w-md px-8">
          <Form method="post" className="space-y-6" noValidate>
            <div>
              <Label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-zinc-200"
              >
                {t("email_label")}
              </Label>
              <div className="mt-1">
                <Input
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
                  placeholder="example@opensensemap.org"
                />
                {actionData?.errors?.email && (
                  <div className="pt-1 text-red-500" id="email-error">
                    {actionData.errors.email}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-zinc-200"
              >
                {t("password_label")}
              </Label>
              <div className="mt-1">
                <Input
                  id="password"
                  ref={passwordRef}
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={actionData?.errors?.password ? true : undefined}
                  aria-describedby="password-error"
                  className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                  placeholder="********"
                />
                {actionData?.errors?.password && (
                  <div className="pt-1 text-red-500" id="password-error">
                    {actionData.errors.password}
                  </div>
                )}
              </div>
            </div>

            <Input type="hidden" name="redirectTo" value={redirectTo} />
            <button
              type="submit"
              className="focus:bg-blue-200 w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-100"
              // onClick={() => {
              //   toast({
              //     description: "Logging in ...",
              //   });
              // }}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? t("transition_label") : t("login_label")}
            </button>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="text-blue-600 h-4 w-4 rounded border-gray-300 dark:border-zinc-200 px-1 py-1 focus:ring-blue-500"
                />
                <Label
                  htmlFor="remember"
                  className="ml-2 block text-sm text-gray-900 dark:text-zinc-200"
                >
                  {t("remember_label")}
                </Label>
              </div>
              <div className="text-center text-sm text-gray-500">
                {t("no_account_label")}{" "}
                <Link
                  className="text-blue-500 underline dark:text-zinc-200"
                  to={{
                    pathname: "/explore/register",
                    search: searchParams.toString(),
                  }}
                >
                  {t("register_label")}
                </Link>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
