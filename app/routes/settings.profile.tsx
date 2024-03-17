import {
  Form,
  Link,
  Outlet,
  useActionData,
  // useFormAction,
  useLoaderData,
  // useNavigation,
} from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import type { DataFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { Separator } from "~/components/ui/separator";
import { conform, useForm } from "@conform-to/react";
import { requireUserId } from "~/session.server";
import { drizzleClient } from "~/db.server";
import { getInitials } from "~/utils/misc";
import { z } from "zod";
import { nameSchema } from "~/utils/user-validation";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import ErrorMessage from "~/components/error-message";
import { profile } from "~/schema";
import { eq } from "drizzle-orm";
import { getProfileByUserId } from "~/models/profile.server";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

const profileFormSchema = z.object({
  username: nameSchema.optional(),
  visibility: z.preprocess((value) => value === "true", z.boolean().optional()),
});

export async function loader({ request }: DataFunctionArgs) {
  const userId = await requireUserId(request);
  const profile = await getProfileByUserId(userId);
  if (!profile) {
    // throw await authenticator.logout(request, { redirectTo: "/" });
    throw new Error();
  }
  return json({ profile });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const submission = await parse(formData, {
    async: true,
    schema: profileFormSchema.superRefine(
      async ({ username, visibility }, ctx) => {
        // if (newPassword && !currentPassword) {
        //   ctx.addIssue({
        //     path: ["newPassword"],
        //     code: "custom",
        //     message: "Must provide current password to change password.",
        //   });
        // }
        // if (currentPassword && newPassword) {
        //   const user = await verifyLogin(username, currentPassword);
        //   if (!user) {
        //     ctx.addIssue({
        //       path: ["currentPassword"],
        //       code: "custom",
        //       message: "Incorrect password.",
        //     });
        //   }
        // }
      },
    ),
  });
  if (submission.intent !== "submit") {
    return json({ status: "idle", submission } as const);
  }
  if (!submission.value) {
    return json(
      {
        status: "error",
        submission,
      } as const,
      { status: 400 },
    );
  }
  const { username, visibility } = submission.value;

  await drizzleClient
    .update(profile)
    .set({
      username,
      public: visibility,
    })
    .where(eq(profile.userId, userId));

  return redirect(`/settings/profile`);
}

export default function EditUserProfilePage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  // const navigation = useNavigation();
  // const formAction = useFormAction();

  // const isSubmitting =
  //   navigation.state === "submitting" &&
  //   navigation.formAction === formAction &&
  //   navigation.formMethod === "post";

  // The `useForm` hook will return everything you need to setup a form
  // including the error and config of each field
  const [form, fields] = useForm({
    id: "edit-profile",
    constraint: getFieldsetConstraint(profileFormSchema),
    lastSubmission: actionData?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: profileFormSchema });
    },
    defaultValue: {
      username: data.profile.username,
      visibility: data.profile.public ? "true" : "false",
    },
    shouldRevalidate: "onBlur",
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          This is how others will see you on the site.
        </p>
      </div>
      <Separator />
      <div className="mt-16 flex gap-12">
        <Form method="post" className="w-1/2" {...form.props}>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor={fields.username.id}>Username</Label>
            <Input type="text" {...conform.input(fields.username)} />
            <div>{fields.username.error}</div>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-medium">Visibility</h3>
            <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <div className="flex items-center space-y-0.5">
                <Input
                  className="flex h-6 w-6 items-center justify-center rounded border"
                  {...conform.input(fields.visibility, {
                    type: "checkbox",
                    value: "true",
                  })}
                />
                <Label htmlFor={fields.visibility.id} className="ml-4">
                  Public
                </Label>
              </div>
            </div>
          </div>
          <div className="mt-8 flex">
            <Button type="submit">Save changes</Button>
          </div>
        </Form>
        <div className="flex w-1/2 justify-center">
          <div className="relative h-52 w-52">
            <Avatar className="h-full w-full">
              <AvatarImage
                className="aspect-auto w-full h-full rounded-full object-cover"
                src={"/resources/file/" + data.profile.profileImage?.id}
              />
              <AvatarFallback>
                {getInitials(data.profile?.username ?? "")}
              </AvatarFallback>
            </Avatar>
            <Link
              preventScrollReset
              to="photo"
              className="border-night-700 bg-night-500 absolute -right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full border-4 p-5"
              title="Change profile photo"
              aria-label="Change profile photo"
            >
              {/* TODO: Make this lucide pencil icon work */}
              {/* <Pencil /> */}
              &#x270E;
            </Link>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ErrorMessage />
    </div>
  );
}
