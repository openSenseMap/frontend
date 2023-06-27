import {
  Form,
  Link,
  Outlet,
  useActionData,
  useLoaderData,
} from "@remix-run/react";
import type { DataFunctionArgs, LoaderArgs } from "@remix-run/node";
import { json, type ActionArgs } from "@remix-run/node";
import { Separator } from "~/components/ui/separator";
import { parse, useForm } from "@conform-to/react";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";
import { getUserImgSrc } from "~/utils/misc";

export async function loader({ request }: DataFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.profile.findUnique({
    where: { userId: userId },
    select: {
      id: true,
      name: true,
      imageId: true,
    },
  });
  if (!user) {
    // throw await authenticator.logout(request, { redirectTo: "/" });
    throw new Error();
  }
  return json({ user });
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();

  // Replace `Object.fromEntries()` with the parse function

  const submission = parse(formData, {
    // You can also pass a schema instead of a custom resolve function
    // if you are validating using yup or zod
    resolve({ email, password }) {
      const error: Record<string, string> = {};

      if (!email) {
        error.email = "Email is required";
      } else if (!email.includes("@")) {
        error.email = "Email is invalid";
      }

      if (!password) {
        error.password = "Password is required";
      }

      if (error.email || error.password) {
        return { error };
      }

      // Resolve it with a value only if no error
      return {
        value: { email, password },
      };
    },
  });

  // Send the submission data back to client
  // 1) if the intent is not `submit`, or
  // 2) if there is any error
  if (submission.intent !== "submit" || !submission.value) {
    return json({
      ...submission,
      // The payload will be used as the default value
      // if the document is reloaded on form submit
      payload: {
        email: submission.payload.email,
      },
    });
  }

  return json({});
}

export default function ProfilePage() {
  const data = useLoaderData<typeof loader>();
  const lastSubmission = useActionData<typeof action>();

  // The `useForm` hook will return everything you need to setup a form
  // including the error and config of each field
  const [form, { email, password }] = useForm({
    // The last submission will be used to report the error and
    // served as the default value and initial error of the form
    // for progressive enhancement
    lastSubmission,

    // Validate the field once the `blur` event is dispatched from the input
    shouldValidate: "onBlur",
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
      <div className="mt-16 flex flex-col gap-12">
        <div className="flex justify-center">
          <div className="relative h-52 w-52">
            <img
              src={getUserImgSrc(data.user.imageId)}
              alt={data.user.name}
              className="h-full w-full rounded-full object-cover"
            />
            <Link
              preventScrollReset
              to="photo"
              className="border-night-700 bg-night-500 absolute -right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full border-4 p-5"
              title="Change profile photo"
              aria-label="Change profile photo"
            >
              📷
            </Link>
          </div>
        </div>
      </div>
      <Form method="post" {...form.props}>
        {/* <div>
          <label>Email</label>
          <input type="email" name="email" />
          <div>{email.error}</div>
        </div>

        <div>
          <label>Password</label>
          <input type="password" name="password" />
          <div>{password.error}</div>
        </div>

        <button>Login</button> */}
      </Form>
      <Outlet />
    </div>
  );
}
