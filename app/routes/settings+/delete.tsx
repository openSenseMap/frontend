import { Form, useActionData } from "@remix-run/react";
import { data, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getUser, getUserEmail, getUserId } from "~/session.server";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import invariant from "tiny-invariant";
import { deleteUserByEmail, getUserByEmail } from "~/models/user.server";
import { useEffect, useRef, useState } from "react";
import { useToast } from "~/components/ui/use-toast";

//*****************************************************
export async function loader({ request }: LoaderFunctionArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  //* get user email
  const userEmail = await getUserEmail(request);
  //* load user data
  invariant(userEmail, `Email not found!`);
  const userData = await getUserByEmail(userEmail);
  return userData;
}

//*****************************************************
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  // log all values of the form
  const { intent, ...values } = Object.fromEntries(formData);
  const { passwordDelete } = values;

  invariant(typeof passwordDelete === "string", "password must be a string");

  const user = await getUser(request);
  //* if entered password is invalid
  if (!user) {
    return data(
      {
        errors: {
          passwordDelete: "Invalid password",
        },
        intent: intent,
      },
      { status: 400 },
    );
  }

  //* delete user
  await deleteUserByEmail(user.email);

  return redirect("");
}

export default function EditUserProfilePage() {
  const actionData = useActionData<typeof action>();
  const [passwordDelVal, setPasswordVal] = useState(""); //* to enable delete account button
  //* To focus when an error occured
  const passwordDelRef = useRef<HTMLInputElement>(null);
  //* toast
  const { toast } = useToast();

  useEffect(() => {
    //* when password is not correct
    if (actionData && actionData?.errors?.passwordDelete) {
      toast({
        title: "Invalid password",
        variant: "destructive",
      });
      passwordDelRef.current?.focus();
    }
  }, [actionData, toast]);

  return (
    <Form method="post" className="space-y-6" noValidate>
      <Card className="dark:bg-dark-boxes dark:border-white">
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
          <CardDescription>
            Deleting your account will permanently remove all of your data from
            our servers. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="passwordDelete">Confirm Password</Label>
            <Input
              placeholder="Enter your password"
              required
              type="password"
              id="passwordDelete"
              name="passwordDelete"
              ref={passwordDelRef}
              value={passwordDelVal}
              onChange={(e) => setPasswordVal(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            name="intent"
            value="delete"
            variant="destructive"
            disabled={!passwordDelVal}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </Form>
  );
}
