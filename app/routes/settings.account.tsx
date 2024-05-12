import {
  Form,
  useActionData,
  // useFormAction,
  useLoaderData,
  // useNavigation,
} from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { getUserEmail, getUserId } from "~/session.server";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import invariant from "tiny-invariant";
import {
  deleteUserByEmail,
  getUserByEmail,
  updateUserName,
  updateUserlocale,
  verifyLogin,
} from "~/models/user.server";
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
  return json(userData);
}

//*****************************************************
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  // log all values of the form
  const { intent, ...values } = Object.fromEntries(formData);
  const { name, passwordUpdate, passwordDelete, email, language } = values;

  const errors = {
    name: name ? null : "Invalid name",
    email: email ? null : "Invalid email",
    passwordUpdate: passwordUpdate ? null : "Password is required",
    passwordDelete: passwordDelete ? null : "Password is required",
  };

  /* const hasErrors = Object.values(errors).some((errorMessage) => errorMessage);
  if (hasErrors) {
    return json({ errors: errors, status: 400 });
  } */

  invariant(typeof name === "string", "name must be a string");
  invariant(typeof email === "string", "email must be a string");
  invariant(typeof passwordUpdate === "string", "password must be a string");
  invariant(typeof passwordDelete === "string", "password must be a string");
  invariant(typeof language === "string", "language must be a string");

  //* check button intent
  switch (intent) {
    case "update": {
      //* check password validaty
      if (errors.passwordUpdate) {
        return json({
          errors: {
            name: null,
            email: null,
            passwordUpdate: errors.passwordUpdate,
            passwordDelete: null,
          },
          intent: intent,
          status: 400,
        });
      }

      const user = await verifyLogin(email, passwordUpdate);
      //* if entered password is invalid
      if (!user) {
        return json(
          {
            errors: {
              name: null,
              email: null,
              passwordUpdate: "Invalid password",
              passwordDelete: null,
            },
            intent: intent,
          },
          { status: 400 },
        );
      }

      await updateUserlocale(email, language);

      await updateUserName(email, name);

      //* return error free to show toast msg
      return json(
        {
          errors: {
            name: null,
            email: null,
            passwordUpdate: null,
            passwordDelete: null,
            passwordDe: null,
          },
          intent: intent,
        },
        { status: 200 },
      );
    }

    case "delete": {
      const user = await verifyLogin(email, passwordDelete);

      //* if entered password is invalid
      if (!user) {
        return json(
          {
            errors: {
              name: null,
              email: null,
              passwordUpdate: null,
              passwordDelete: "Invalid password",
            },
            intent: intent,
          },
          { status: 400 },
        );
      }

      //* delete user
      await deleteUserByEmail(email);
    }
  }

  return redirect("");
}

export default function EditUserProfilePage() {
  const userData = useLoaderData<typeof loader>(); //* to load user data
  const actionData = useActionData<typeof action>();
  const [passwordDelVal, setPasswordVal] = useState(""); //* to enable delete account button
  const [lang, setLang] = useState(userData?.language || "en_US");
  const [name, setName] = useState(userData?.name || "");
  //* To focus when an error occured
  const passwordDelRef = useRef<HTMLInputElement>(null);
  const passwordUpdRef = useRef<HTMLInputElement>(null);
  //* toast
  const { toast } = useToast();

  useEffect(() => {
    //* when password is not correct
    if (actionData && actionData?.errors?.passwordDelete) {
      passwordDelRef.current?.focus();
    } else if (actionData && actionData?.errors?.passwordUpdate) {
      passwordUpdRef.current?.focus();
    }
    //* when passwordUpdate is correct
    if (
      actionData &&
      !actionData?.errors?.passwordUpdate &&
      actionData?.intent === "update"
    ) {
      toast({
        title: "Profile succesfully updated.",
        // description: "",
      });
    }
  }, [actionData, toast]);

  return (
    <Form method="post" className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Update your basic account details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              required
              name="name"
              type="text"
              placeholder="Enter your name"
              defaultValue={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              placeholder="Enter your email"
              type="email"
              readOnly={true}
              defaultValue={userData?.email}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="language">Language</Label>
            <Select
              defaultValue={lang}
              onValueChange={(value) => setLang(value)}
              name="language"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en_US">English</SelectItem>
                <SelectItem value="de_De">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="passwordUpdate">Confirm password</Label>
            <Input
              ref={passwordUpdRef}
              id="passwordUpdate"
              placeholder="Enter your current password"
              type="password"
              name="passwordUpdate"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" name="intent" value="update">
            Save Changes
          </Button>
        </CardFooter>
      </Card>
      <Card>
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
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </Form>
  );
}
