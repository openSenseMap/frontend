import type { ActionArgs, LoaderArgs, MetaFunction } from "@remix-run/node";
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

import { createUserSession, getUserId } from "~/session.server";
import {
  createUser,
  getUserByEmail,
  getUserByName,
} from "~/models/user.server";
import { safeRedirect, validateEmail, validateName } from "~/utils";

import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18next from "app/i18next.server";
import invariant from "tiny-invariant";

export async function loader({ request }: LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const { username, email, password } = Object.fromEntries(formData);
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/explore");

  if (!username || typeof username !== "string") {
    return json(
      {
        errors: {
          username: "UserName is required",
          email: null,
          password: null,
        },
      },
      { status: 400 }
    );
  }

  //* Validate userName
  const validateUserName = validateName(username?.toString());
  if (!validateUserName.isValid) {
    return json(
      {
        errors: {
          username: validateUserName.errorMsg,
          password: null,
          email: null,
        },
      },
      { status: 400 }
    );
  }

  if (!validateEmail(email)) {
    return json(
      { errors: { username: null, email: "Email is invalid", password: null } },
      { status: 400 }
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return json(
      {
        errors: {
          username: null,
          password: "Password is required",
          email: null,
        },
      },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return json(
      {
        errors: {
          username: null,
          password: "Password is too short",
          email: null,
        },
      },
      { status: 400 }
    );
  }

  //* check if user exists by name
  const existingUserByName = await getUserByName(username);
  if (existingUserByName) {
    return json(
      {
        errors: {
          username: "A user already exists with this name",
          email: null,
          password: null,
        },
      },
      { status: 400 }
    );
  }

  //* check if user exists by email
  const existingUserByEmail = await getUserByEmail(email);
  if (existingUserByEmail) {
    return json(
      {
        errors: {
          username: null,
          email: "A user already exists with this email",
          password: null,
        },
      },
      { status: 400 }
    );
  }

  //* get current locale
  const locale = await i18next.getLocale(request);
  const language = locale === "de" ? "de_DE" : "en_US";

  const user = await createUser(
    username,
    email,
    language,
    password,
    username?.toString()
  );

  return createUserSession({
    request,
    userId: user.id,
    remember: false,
    redirectTo,
  });
}

export const meta: MetaFunction = () => {
  return {
    title: "Sign Up",
  };
};

export default function RegisterDialog() {
  const { t } = useTranslation("register");
  const [searchParams] = useSearchParams();
  const redirectTo =
    // @ts-ignore
    searchParams.size > 0 ? "/explore?" + searchParams.toString() : "/explore";
  const actionData = useActionData<typeof action>();
  const usernameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  const navigation = useNavigation();
  const isCreating = Boolean(navigation.state === "submitting");

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
        id="signup-modal"
        data-state="open"
        className="fixed top-[20%] z-50 grid h-fit w-full gap-4 rounded-b-lg border bg-background p-6 shadow-lg animate-in data-[state=open]:fade-in-90 data-[state=open]:slide-in-from-bottom-10 sm:max-w-lg sm:rounded-lg sm:zoom-in-90 data-[state=open]:sm:slide-in-from-bottom-0"
      >
        <span className="pl-5 text-4xl font-medium">{t("register_label")}</span>
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
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                {"Username"}
              </Label>
              <div className="mt-1">
                <Input
                  ref={usernameRef}
                  id="username"
                  name="username"
                  type="text"
                  autoFocus={true}
                  className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                  placeholder="Username"
                />
                {actionData?.errors?.username && (
                  <div className="pt-1 text-red-500" id="password-error">
                    {actionData.errors.username}
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
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
                className="block text-sm font-medium text-gray-700"
              >
                {t("password_label")}
              </Label>
              <div className="mt-1">
                <Input
                  id="password"
                  ref={passwordRef}
                  name="password"
                  type="password"
                  autoComplete="new-password"
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
              //     description: "Creating account ...",
              //   });
              // }}
              disabled={isCreating}
            >
              {isCreating ? t("transition_label") : t("register_label")}
            </button>
            <div className="flex items-center justify-center">
              <div className="text-center text-sm text-gray-500">
                {t("already_account_label")}{" "}
                <Link
                  className="text-blue-500 underline"
                  to={{
                    pathname: "/explore/login",
                    search: searchParams.toString(),
                  }}
                >
                  {t("login_label")}
                </Link>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
