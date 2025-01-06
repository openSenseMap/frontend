import { Form, useActionData, useLoaderData, data, redirect } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
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
  getUserByEmail,
  updateUserName,
  updateUserlocale,
  verifyLogin,
} from "~/models/user.server";
import { useEffect, useRef, useState } from "react";
import { useToast } from "~/components/ui/use-toast";

//*****************************************************
export async function loader({ request }: LoaderFunctionArgs) {
  // If user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  // Get user email and load user data
  const userEmail = await getUserEmail(request);
  invariant(userEmail, `Email not found!`);
  const userData = await getUserByEmail(userEmail);
  return userData;
}

//*****************************************************
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const { name, passwordUpdate, email, language } =
    Object.fromEntries(formData);

  const errors = {
    name: name ? null : "Invalid name",
    email: email ? null : "Invalid email",
    passwordUpdate: passwordUpdate ? null : "Password is required",
  };

  invariant(typeof name === "string", "name must be a string");
  invariant(typeof email === "string", "email must be a string");
  invariant(typeof passwordUpdate === "string", "password must be a string");
  invariant(typeof language === "string", "language must be a string");

  // Validate password
  if (errors.passwordUpdate) {
    return data(
      {
        errors: {
          name: null,
          email: null,
          passwordUpdate: errors.passwordUpdate,
        },
        status: 400,
      },
      { status: 400 },
    );
  }

  const user = await verifyLogin(email, passwordUpdate);
  // If password is invalid
  if (!user) {
    return data(
      {
        errors: {
          name: null,
          email: null,
          passwordUpdate: "Invalid password",
        },
      },
      { status: 400 },
    );
  }

  // Update locale and name
  await updateUserlocale(email, language);
  await updateUserName(email, name);

  // Return success response
  return data(
    {
      errors: {
        name: null,
        email: null,
        passwordUpdate: null,
      },
    },
    { status: 200 },
  );
}

//*****************************************************
export default function EditUserProfilePage() {
  const userData = useLoaderData<typeof loader>(); // Load user data
  const actionData = useActionData<typeof action>();
  const [lang, setLang] = useState(userData?.language || "en_US");
  const [name, setName] = useState(userData?.name || "");
  const passwordUpdRef = useRef<HTMLInputElement>(null); // For password update focus
  const { toast } = useToast();

  useEffect(() => {
    // Handle invalid password update error
    if (actionData && actionData?.errors?.passwordUpdate) {
      toast({
        title: "Invalid password",
        variant: "destructive",
      });
      passwordUpdRef.current?.focus();
    }
    // Show success toast if profile updated
    if (actionData && !actionData?.errors?.passwordUpdate) {
      toast({
        title: "Profile successfully updated.",
        variant: "success",
      });
    }
  }, [actionData, toast]);

  return (
    <Form method="post" className="space-y-6" noValidate>
      <Card className="dark:bg-dark-boxes dark:border-white">
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
              <SelectTrigger className="dark:border-white">
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
              autoComplete="current-password"
              ref={passwordUpdRef}
              id="passwordUpdate"
              placeholder="Enter your current password"
              type="password"
              name="passwordUpdate"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            // Disable button if no changes were made
            disabled={name === userData?.name && lang === userData?.language}
          >
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </Form>
  );
}
