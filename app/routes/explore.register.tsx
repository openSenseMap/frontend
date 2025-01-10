import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { data, redirect } from "react-router";
import { Form, Link, useActionData, useNavigation, useSearchParams } from "react-router";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUserSession, getUserId } from "~/session.server";
import { createUser, getUserByEmail } from "~/models/user.server";
import { safeRedirect, validateEmail, validateName } from "~/utils";
import { useTranslation } from "react-i18next";
import i18next from "app/i18next.server";
import invariant from "tiny-invariant";
import Spinner from "~/components/spinner";
import ErrorMessage from "~/components/error-message";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return {};
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const { username, email, password } = Object.fromEntries(formData);
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/explore");

  if (!username || typeof username !== "string") {
    return data(
      {
        errors: {
          username: "UserName is required",
          email: null,
          password: null,
        },
      },
      { status: 400 },
    );
  }

  //* Validate userName
  const validateUserName = validateName(username?.toString());
  if (!validateUserName.isValid) {
    return data(
      {
        errors: {
          username: validateUserName.errorMsg,
          password: null,
          email: null,
        },
      },
      { status: 400 },
    );
  }

  if (!validateEmail(email)) {
    return data(
      { errors: { username: null, email: "Email is invalid", password: null } },
      { status: 400 },
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return data(
      {
        errors: {
          username: null,
          password: "Password is required",
          email: null,
        },
      },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return data(
      {
        errors: {
          username: null,
          password: "Password is too short",
          email: null,
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
          username: null,
          email: "A user already exists with this email",
          password: null,
        },
      },
      { status: 400 },
    );
  }

  invariant(typeof username === "string", "username must be a string");

  //* get current locale
  const locale = await i18next.getLocale(request);
  const language = locale === "de" ? "de_DE" : "en_US";

  //* temp -> dummy name
  // const name = "Max Mustermann";

  const user = await createUser(username, email, language, password);
  // const user = await createUser(email, password, username?.toString());

  return createUserSession({
    request,
    userId: user[0].id,
    remember: false,
    redirectTo,
  });
}

export const meta: MetaFunction = () => {
  return [{ title: "Explore" }];
};

export default function RegisterDialog() {
  const { t } = useTranslation("register");
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const actionData = useActionData<typeof action>();
  const usernameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.username) {
      usernameRef.current?.focus();
    } else if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div className="flex justify-center items-center h-screen">
      <Link
        to={{
          pathname: "/explore",
          search: searchParams.toString(),
        }}
      >
        <div className="fixed inset-0 z-40 h-full w-full bg-black opacity-25" />
      </Link>
      <Card className="w-full max-w-md z-50">
        {navigation.state === "loading" && (
          <div className="bg-white/30 dark:bg-zinc-800/30 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
            <Spinner />
          </div>
        )}
        <Form method="post" className="space-y-6" noValidate>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Register</CardTitle>
            <CardDescription>
              Create a new account to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                ref={usernameRef}
                name="username"
                type="text"
                autoFocus={true}
              />
              {actionData?.errors?.username && (
                <div className="text-sm text-red-500 mt-1" id="password-error">
                  {actionData.errors.username}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email_label")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                ref={emailRef}
                required
                autoFocus={true}
                name="email"
                autoComplete="email"
                aria-invalid={actionData?.errors?.email ? true : undefined}
                aria-describedby="email-error"
              />
              {actionData?.errors?.email && (
                <div className="text-sm text-red-500 mt-1" id="email-error">
                  {actionData.errors.email}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password_label")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                ref={passwordRef}
                name="password"
                autoComplete="new-password"
                aria-invalid={actionData?.errors?.password ? true : undefined}
                aria-describedby="password-error"
              />
              {actionData?.errors?.password && (
                <div className="text-sm text-red-500 mt-1" id="password-error">
                  {actionData.errors.password}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-2">
            <Button className="w-full bg-light-blue">Register</Button>
            <div className="text-sm text-muted-foreground">
              {t("already_account_label")}{" "}
              <Link to="/explore/login" className="underline">
                {t("login_label")}
              </Link>
            </div>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <ErrorMessage />
    </div>
  );
}
