import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { updateUserPassword, verifyLogin } from "~/models/user.server";
import { getUserEmail, getUserId } from "~/session.server";
import { Separator } from "~/components/ui/separator";
import { validatePassLength, validatePassType } from "~/utils";
import { useToast } from "@/components/ui/use-toast";
import React from "react";

//*****************************************************
export async function loader({ request }: LoaderArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");
  return json({});
}

//*****************************************************
export async function action({ request }: ActionArgs) {
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
      { status: 400 }
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
      { status: 400 }
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
      { status: 400 }
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
      { status: 400 }
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
      { status: 400 }
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
      { status: 400 }
    );
  }

  //* update user password
  await updateUserPassword(userId, newPass);

  return redirect ("")
  //* logout
  // return logout({ request: request, redirectTo: "/explore" });
}

//**********************************
export default function ChangePaasswordPage() {
  const actionData = useActionData<typeof action>();

  const currPassRef = React.useRef<HTMLInputElement>(null);
  const newPassRef = React.useRef<HTMLInputElement>(null);
  const confirmPassRef = React.useRef<HTMLInputElement>(null);

  //* toast
  const { toast } = useToast();

  React.useEffect(() => {
    if (actionData?.errors?.currPass) {
      currPassRef.current?.focus();
    } else if (actionData?.errors?.newPass) {
      newPassRef.current?.focus();
    } else if (actionData?.errors?.confirmPass) {
      confirmPassRef.current?.focus();
    } else if (actionData?.errors?.passMatch) {
      newPassRef.current?.focus();
    }else {
      toast({
        title: "Password sucessfully updated.",
        // description: "",
      });
    }
  }, [actionData]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Account - Change password</h3>
        <p className="text-sm text-muted-foreground">Update your password.</p>
      </div>
      <Separator />
      <div className="grid grid-rows-1">
        <div className="flex min-h-full items-center justify-center">
          <div className="mx-auto w-full font-helvetica">
            {/* Form */}
            <Form method="post" className="space-y-6" noValidate>
              {/* Password */}
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-base  tracking-normal"
                >
                  Current password
                </label>

                <div className="mt-1">
                  <input
                    ref={currPassRef}
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    placeholder="Current Password"
                    // defaultValue={123}
                    className="w-full rounded border border-gray-200 px-2 py-1 text-base placeholder-[#999]"
                  />
                  {actionData?.errors?.currPass && (
                    <div className="pt-1 text-[#FF0000]" id="currPass-error">
                      {actionData.errors.currPass}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="txt-base block  tracking-normal"
                >
                  New password
                </label>

                <div className="mt-1">
                  <input
                    ref={newPassRef}
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="New Password"
                    // defaultValue={123}
                    className="w-full rounded border border-gray-200 px-2 py-1 text-base placeholder-[#999]"
                  />
                  {actionData?.errors?.newPass && (
                    <div className="pt-1 text-[#FF0000]" id="newPass-error">
                      {actionData.errors.newPass}
                    </div>
                  )}
                  {actionData?.errors?.passMatch && (
                    <div className="pt-1 text-[#FF0000]" id="confirmPass-error">
                      {actionData.errors.passMatch}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="newPasswordConfirm"
                  className="txt-base block  tracking-normal"
                >
                  Confirm new password
                </label>

                <div className="mt-1">
                  <input
                    ref={confirmPassRef}
                    id="newPasswordConfirm"
                    name="newPasswordConfirm"
                    type="password"
                    placeholder="New Password Confirm"
                    // defaultValue={123}
                    className="w-full rounded border border-gray-200 px-2 py-1 text-base placeholder-[#999]"
                  />
                  {actionData?.errors?.confirmPass && (
                    <div className="pt-1 text-[#FF0000]" id="confirmPass-error">
                      {actionData.errors.confirmPass}
                    </div>
                  )}
                </div>
              </div>

              {/* divider */}
              <hr className="my-2 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

              {/* Cancel and Update buttons */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  name="intent"
                  value="cancel"
                  disabled={false}
                  className="rounded border border-gray-200 px-4 py-2 text-black disabled:border-[#ccc] disabled:text-[#8a8989]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  name="intent"
                  value="update"
                  disabled={false}
                  className="ml-3 rounded border border-gray-200 px-4 py-2 text-black disabled:border-[#ccc]  disabled:text-[#8a8989]"
                >
                  Update
                </button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
