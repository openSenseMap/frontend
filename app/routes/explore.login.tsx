import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
  data,
  redirect,
  Form,
  Link,
  useActionData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ErrorMessage from "~/components/error-message";
import Spinner from "~/components/spinner";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { verifyLogin } from "~/models/user.server";
import { safeRedirect, validateEmail } from "~/utils";
import { createUserSession, getUserId } from "~/utils/session.server";
import { setLanguageCookie } from "~/lib/set-language.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/explore");
  return {};
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/explore");
  const remember = formData.get("remember");

  if (!validateEmail(email)) {
    return data(
      { errors: { email: "Email is invalid", password: null } },
      { status: 400 },
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return data(
      { errors: { password: "Password is required", email: null } },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return data(
      { errors: { password: "Password is too short", email: null } },
      { status: 400 },
    );
  }

  const user = await verifyLogin(email, password);
  const userLocale = user?.language
      ? user.language.split(/[_-]/)[0].toLowerCase()
      : "en";
 
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
    headers: {
      "Set-Cookie": await setLanguageCookie(userLocale),
    }
  });
}

export const meta: MetaFunction = () => {
  return [{ title: "Login" }];
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const actionData = useActionData<typeof action>();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  const { t } = useTranslation("login");
  const navigation = useNavigation();

  React.useEffect(() => {
    if (actionData?.errors?.email) {
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
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">{t("welcome_back")}</CardTitle>
            <CardDescription>{t("sign_in")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email_label")}</Label>
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
                placeholder={t("example_placeholder")}
              />
              {actionData?.errors?.email && (
                <div className="text-sm text-red-500 mt-1" id="email-error">
                  {t(actionData.errors.email)}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password"> {t("password_label")}</Label>
                <Link to="/explore/forgot" className="text-sm underline">
                  {t("forgot_password")}
                </Link>
              </div>
              <Input
                id="password"
                ref={passwordRef}
                name="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={actionData?.errors?.password ? true : undefined}
                aria-describedby="password-error"
                placeholder="********"
              />
              {actionData?.errors?.password && (
                <div className="text-sm text-red-500 mt-1" id="password-error">
                  {t(actionData.errors.password)}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" name="remember" />
              <Label htmlFor="remember" className="text-sm">
                {t("remember_label")}
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-2">
            <Button type="submit" className="w-full bg-light-blue">
              {t("sign_in_button")}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t("no_account_label")}{" "}
              <Link
                className="font-medium underline"
                to={{
                  pathname: "/explore/register",
                  search: searchParams.toString(),
                }}
              >
                {t("register_label")}
              </Link>
            </p>
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
