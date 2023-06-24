
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
import { getUserId } from "~/session.server";
// import { loader } from "../mydevices.$box.edit";

//*****************************************************
export async function loader({ request, params }: LoaderArgs) {
  console.log("🚀 ~ **: mydevices.box.edit.general.tsx:16 ~ loader ~ params:", params)
  //* if user is not logged in, redirect to home
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  const deviceID = params.box;
  console.log("🚀 ~ **: mydevices.box.edit.general.tsx:21 ~ loader ~ deviceID:", deviceID)
  // invariant(deviceID, "deviceID not found")
  // if(deviceID)
  // const deviceData = getDevice(deviceID);

  return json({DevieID: deviceID, });
}

//*****************************************************
export async function action({ request }: ActionArgs) {
  return redirect("/");
}

//**********************************
export default function EditBoxExtensions() {

  const deviceId = useLoaderData<typeof loader>();
  console.log("🚀 ~ **************** file: mydevices.$box.edit.tsx:42 ~ General ~ deviceId:", deviceId);

  return (
    <div className="grid grid-rows-1">
      {/* gerneral form */}
      <div className="flex min-h-full items-center justify-center">
        <div className="mx-auto w-full max-w-5xl font-helvetica">
          {/* Heading */}
          <div className="inline-flex">
            {/* View title */}
            <div>
              <h1 className="mt-2 text-4xl">Extensions</h1>
            </div>
          </div>

          {/* divider */}
          <hr className="my-2 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}
