import * as React from "react";
import { useTranslation } from "react-i18next";
import  { type ActionFunctionArgs, type LoaderFunctionArgs, type MetaFunction, data, redirect, Form, Link, useActionData, useNavigation, useSearchParams  } from "react-router";
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
import { validateEmail } from "~/utils.server";
import { getUserId } from "~/utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/explore");
  return {};
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");

  if (!validateEmail(email)) {
    return data(
      { errors: { email: "Email is invalid" }, success: false },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      "https://api.opensensemap.org/users/request-password-reset",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return data(
        { errors: { email: errorData.message }, success: false },
        { status: response.status },
      );
    }

    const jsonData = await response.json();
    return data(
      {
        code: jsonData.code,
        message: jsonData.message,
        success: true,
        errors: { email: null },
      },
      { status: 200 },
    );
  } catch (error) {
    return data(
      {
        errors: { email: "An error occurred. Please try again later." },
        success: false,
        error: error
      },
      { status: 500 },
    );
  }
}

export const meta: MetaFunction = () => {
  return [{ title: "Login" }];
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const actionData = useActionData<typeof action>();
  const emailRef = React.useRef<HTMLInputElement>(null);

  const { t } = useTranslation("login");
  const navigation = useNavigation();

  React.useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
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
        {actionData?.success ? (
          <div className="w-full max-w-md text-center bg-white p-6 rounded-md shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Request Sent</h2>
            <p className="mb-6">
              An email with instructions to reset your password has been sent.
              Please check your inbox.
            </p>
            <Link to="/explore/login">
              <Button className="w-full bg-light-blue">Back to Login</Button>
            </Link>
          </div>
        ) : (
          <>
            <Form method="post" className="space-y-6" noValidate>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">
                  Forgot your password?
                </CardTitle>
                <CardDescription>Reset password by mail</CardDescription>
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
                    placeholder="example@opensensemap.org"
                  />
                  {actionData?.errors?.email && (
                    <div className="text-sm text-red-500 mt-1" id="email-error">
                      {actionData.errors.email}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-center gap-2">
                <Button type="submit" className="w-full bg-light-blue">
                  Reset
                </Button>
                <p className="text-sm text-muted-foreground">
                  {"Remember your password?"}{" "}
                  <Link
                    className="font-medium underline"
                    to={{
                      pathname: "/explore/login",
                      search: searchParams.toString(),
                    }}
                  >
                    {"Login"}
                  </Link>
                </p>
              </CardFooter>
            </Form>
          </>
        )}
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
