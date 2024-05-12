import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { updateUserPassword, verifyLogin } from "~/models/user.server";
import { getUserEmail, getUserId } from "~/session.server";
import { validatePassLength, validatePassType } from "~/utils";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useRef } from "react";
import ErrorMessage from "~/components/error-message";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

//*****************************************************
export async function loader({ request }: LoaderFunctionArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");
  return json({});
}

//*****************************************************
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const currPass = formData.get("currentPassword");
  const newPass = formData.get("newPassword");
  const confirmPass = formData.get("newPasswordConfirm");
  const passwordsList = [currPass, newPass, confirmPass];

  //* when cancel button is clicked
  if (intent === "cancel") {
    return redirect("/account/settings");
  }

  //* validate passwords type
  const checkPasswordsType = validatePassType(passwordsList);
  if (!checkPasswordsType.isValid) {
    return json(
      {
        errors: {
          currPass:
            checkPasswordsType.index == 0
              ? "Current password is required."
              : null,
          newPass:
            checkPasswordsType.index == 1 ? "New password is required." : null,
          confirmPass:
            checkPasswordsType.index == 2
              ? "Password confirmation is required."
              : null,
          passMatch: null,
        },
      },
      { status: 400 },
    );
  }

  //* validate passwords lenghts
  const validatePasswordsLength = validatePassLength(passwordsList);
  if (!validatePasswordsLength.isValid) {
    return json(
      {
        errors: {
          currPass:
            validatePasswordsLength.index == 0
              ? "Please use at least 8 characters."
              : null,
          newPass:
            validatePasswordsLength.index == 1
              ? "Please use at least 8 characters."
              : null,
          confirmPass:
            validatePasswordsLength.index == 2
              ? "Please use at least 8 characters."
              : null,
          passMatch: null,
        },
      },
      { status: 400 },
    );
  }

  //* get user email
  const userEmail = await getUserEmail(request);
  invariant(userEmail, `Email not found!`);

  //* validate password
  if (typeof currPass !== "string" || currPass.length === 0) {
    return json(
      {
        errors: {
          currPass: "Password is required.",
          newPass: null,
          confirmPass: null,
          passMatch: null,
        },
      },
      { status: 400 },
    );
  }

  //* check both new passwords match
  if (newPass !== confirmPass) {
    return json(
      {
        errors: {
          currPass: null,
          newPass: null,
          confirmPass: null,
          passMatch: "Please make sure your passwords match.",
        },
      },
      { status: 400 },
    );
  }

  //* check user password is correct
  const user = await verifyLogin(userEmail, currPass);

  if (!user) {
    return json(
      {
        errors: {
          currPass: "Incorrect password.",
          newPass: null,
          confirmPass: null,
          passMatch: null,
        },
      },
      { status: 400 },
    );
  }

  //* get user ID
  const userId = await getUserId(request);
  invariant(userId, `userId not found!`);

  if (typeof newPass !== "string" || newPass.length === 0) {
    return json(
      {
        errors: {
          currPass: "Password is required.",
          newPass: null,
          confirmPass: null,
          passMatch: null,
        },
      },
      { status: 400 },
    );
  }

  //* update user password
  await updateUserPassword(userId, newPass);

  return redirect("");
  //* logout
  // return logout({ request: request, redirectTo: "/explore" });
}

//**********************************
export default function ChangePaasswordPage() {
  const actionData = useActionData<typeof action>();

  const currPassRef = useRef<HTMLInputElement>(null);
  const newPassRef = useRef<HTMLInputElement>(null);
  const confirmPassRef = useRef<HTMLInputElement>(null);

  //* toast
  const { toast } = useToast();

  useEffect(() => {
    if (actionData?.errors?.currPass) {
      currPassRef.current?.focus();
    } else if (actionData?.errors?.newPass) {
      newPassRef.current?.focus();
    } else if (actionData?.errors?.confirmPass) {
      confirmPassRef.current?.focus();
    } else if (actionData?.errors?.passMatch) {
      newPassRef.current?.focus();
    } else {
      toast({
        title: "Password sucessfully updated.",
        // description: "",
      });
    }
  }, [actionData, toast]);

  return (
    <Form method="post" className="space-y-6" noValidate>
      <Card className="w-full dark:bg-dark-boxes dark:border-white">
        <CardHeader>
          <CardTitle>Update Password</CardTitle>
          <CardDescription>
            Enter your current password and a new password to update your
            account password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              ref={currPassRef}
              id="currentPassword"
              name="currentPassword"
              placeholder="Enter your current password"
              type="password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              ref={newPassRef}
              id="newPassword"
              name="newPassword"
              placeholder="Enter your new password"
              type="password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPasswordConfirm">Confirm Password</Label>
            <Input
              ref={confirmPassRef}
              id="newPasswordConfirm"
              name="newPasswordConfirm"
              placeholder="Confirm your new password"
              type="password"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" name="intent" value="update">
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </Form>
  );
}

export function ErrorBoundary() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ErrorMessage />
    </div>
  );
}
