import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, redirect, Form, useActionData } from "react-router";
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
  return {};
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
    return data(
      {
        success: false,
        message: "Password is required.",
      },
      { status: 400 },
    );
  }

  //* validate passwords lenghts
  const validatePasswordsLength = validatePassLength(passwordsList);
  if (!validatePasswordsLength.isValid) {
    return data(
      {
        success: false,
        message: "Password must be at least 8 characters long.",
      },
      { status: 400 },
    );
  }

  //* get user email
  const userEmail = await getUserEmail(request);
  invariant(userEmail, `Email not found!`);

  //* validate password
  if (typeof currPass !== "string" || currPass.length === 0) {
    return data(
      {
        success: false,
        message: "Current password is required.",
      },
      { status: 400 },
    );
  }

  //* check both new passwords match
  if (newPass !== confirmPass) {
    return data(
      {
        success: false,
        message: "New passwords do not match.",
      },
      { status: 400 },
    );
  }

  //* check user password is correct
  const user = await verifyLogin(userEmail, currPass);

  if (!user) {
    return data(
      { success: false, message: "Current password is incorrect." },
      { status: 400 },
    );
  }

  //* get user ID
  const userId = await getUserId(request);
  invariant(userId, `userId not found!`);

  if (typeof newPass !== "string" || newPass.length === 0) {
    return data(
      { success: false, message: "Password is required." },
      { status: 400 },
    );
  }

  //* update user password
  await updateUserPassword(userId, newPass);

  return data({ success: true, message: "Password updated successfully." });
  //* logout
  // return logout({ request: request, redirectTo: "/explore" });
}

//**********************************
export default function ChangePaasswordPage() {
  const actionData = useActionData<typeof action>();

  let $form = useRef<HTMLFormElement>(null);
  const currPassRef = useRef<HTMLInputElement>(null);
  const newPassRef = useRef<HTMLInputElement>(null);
  const confirmPassRef = useRef<HTMLInputElement>(null);

  //* toast
  const { toast } = useToast();

  useEffect(() => {
    if (actionData) {
      $form.current?.reset();
      if (actionData.success) {
        toast({ title: actionData.message, variant: "success" });
        currPassRef.current?.focus();
      } else {
        toast({
          title: actionData.message,
          variant: "destructive",
          description: "Please try again.",
        });
      }
    }
  }, [actionData, toast]);

  return (
    <Form method="post" className="space-y-6" noValidate ref={$form}>
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
