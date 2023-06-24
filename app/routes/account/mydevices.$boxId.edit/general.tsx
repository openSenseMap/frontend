import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  Link,
  Outlet,
} from "@remix-run/react";
import React, { useState } from "react";
import { typedjson } from "remix-typedjson";
import invariant from "tiny-invariant";
import { deleteDevice, getDeviceWithoutSensors } from "~/models/device.server";
import { verifyLogin } from "~/models/user.server";
import { getUserEmail, getUserId } from "~/session.server";


//*****************************************************
export async function loader({ request, params }: LoaderArgs) {
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  const deviceID = params.boxId;
  console.log("🚀 ~ file: mydevices.box.edit.general.tsx:21 ~ loader ~ deviceID:", deviceID)

  if (typeof deviceID !== "string") {
    return json(
       "deviceID not found"
    );
  }

  const deviceData = await getDeviceWithoutSensors({ id: deviceID });
  console.log("🚀 ~ file: general.tsx:33 ~ loader ~ deviceData:", deviceData)

  // return json(deviceData);
  return typedjson(deviceData);
}

//*****************************************************
export async function action({ request, params }: ActionArgs) {
  const formData = await request.formData();
  const { name, passwordDelete } = Object.fromEntries(formData);

  const errors = {
    // name: name ? null : "Invalid name",
    passwordDelete: passwordDelete ? null : "Password is required",
  };

  const hasErrors = Object.values(errors).some((errorMessage) => errorMessage);
  if (hasErrors) {
    return json({ errors: errors, status: 400 });
  }

  //* check entered password
  //* 1. get user email
  const userEmail = await getUserEmail(request);
  invariant(typeof userEmail === "string", "email not found");
  invariant(typeof passwordDelete === "string", "password must be a string");
  //* 2. check entered password
  const user = await verifyLogin(userEmail, passwordDelete);
  //* 3. retrun error in password is not correct
  if (!user) {
    return json(
      {
        errors: {
          // name: null,
          passwordDelete: "Invalid password",
        },
      },
      { status: 400 }
    );
  }
  //* 4. delete device
  const deviceID = params.boxId;
  if (typeof deviceID !== "string") {
    return json(
      {
        errors: {
          // name: null,
          passwordDelete: "Invalid password",
        },
      },
      { status: 400 }
    );
  }
  await deleteDevice({ id:  deviceID });

  return redirect("/");
}

//**********************************
export default function EditBoxGeneral() {

  const deviceData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [passwordDelVal, setPasswordVal] = useState(""); //* to enable delete account button

  //* focus when an error occured
  const nameRef = React.useRef<HTMLInputElement>(null);
  const passwordDelRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    //* when password is null
    if (actionData && actionData?.errors?.passwordDelete) {
      passwordDelRef.current?.focus();
    }
    //* when password is not correct or null
    else if (actionData && actionData?.errors?.passwordDelete) {
      passwordDelRef.current?.focus();
    } 

  }, [actionData]);

  return (
    <div className="grid grid-rows-1">
        {/* general form */}
        <div className="flex min-h-full items-center justify-center">
          <div className="mx-auto w-full max-w-5xl font-helvetica">
            {/* Heading */}
            <div className="inline-flex">
              {/* Title */}
              <div>
                <h1 className="mt-2 text-4xl">General</h1>
              </div>
            </div>

            {/* divider */}
            <hr className="my-3 mt-6 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

            {/* Form */}
            <div className="pt-4">
              <Form method="post" className="space-y-6" noValidate>
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="txt-base block font-bold tracking-normal"
                  >
                    Name *
                  </label>

                  <div className="mt-1">
                    <input
                      id="name"
                      required
                      autoFocus={true}
                      name="name"
                      type="text"
                      defaultValue={deviceData?.name}
                      ref={nameRef}
                      // onChange={(e) => setName(e.target.value)}
                      aria-describedby="name-error"
                      className="w-full rounded border border-gray-200 px-2 py-1 text-base"
                      // className="w-full rounded border border-[#3c763d] px-2 py-1 text-base focus:ring-[#3c763d]"
                    />
                  </div>
                </div>

                {/* Exposure */}
                <div>
                  <label
                    htmlFor="exposure"
                    className="txt-base block font-bold tracking-normal"
                  >
                    Exposure
                  </label>

                  <div className="mt-1">
                    <select
                      id="exposure"
                      name="exposure"
                      defaultValue={deviceData?.exposure}
                      // onChange={(e) => setLang(e.target.value)}
                      className="appearance-auto w-full rounded border border-gray-200 px-2 py-1.5 text-base"
                    >
                      <option value="INDOOR">indoor</option>
                      <option value="OUTDOOR">outdoor</option>
                      <option value="MOBILE">mobile</option>
                    </select>
                  </div>
                </div>

                
                {/* Delete device */}
                <div>
                  <h1 className="mt-10 text-3xl text-[#FF4136]">
                    Delete senseBox
                  </h1>
                </div>
                
                {/* divider */}
                {/* <hr className="my-2 h-px border-0 bg-[#dcdada] dark:bg-gray-700" /> */}

                <div className="text-[#8a6d3b] bg-[#fcf8e3] border rounded border-[#faebcc] p-4">
                  <p>
                  If you really want to delete your station, please type your current password - all measurements will be deleted as well.

                  </p>
                  {/* <p className="mb-0 mt-1">
                    To delete your account, please type your current password.
                  </p> */}
                </div>
                <div>
                  <input
                    id="passwordDelete"
                    name="passwordDelete"
                    type="password"
                    placeholder="Password"
                    ref={passwordDelRef}
                    // defaultValue={123}
                    className="w-full rounded border border-gray-200 px-2 py-2 text-base placeholder-[#999]"
                    value={passwordDelVal}
                    onChange={(e) => setPasswordVal(e.target.value)}
                  />
                  {actionData?.errors?.passwordDelete && (
                    <div className="pt-1 text-[#FF0000]" id="email-error">
                      {actionData.errors.passwordDelete}
                    </div>
                  )}
                </div>
                {/* Delete button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    name="intent"
                    value="delete"
                    disabled={!passwordDelVal}
                    className="mb-5 rounded border border-gray-200 px-4 py-2 text-black disabled:border-[#ccc] disabled:text-[#8a8989]"
                  >
                    Delete senseBox
                  </button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
  );
}
