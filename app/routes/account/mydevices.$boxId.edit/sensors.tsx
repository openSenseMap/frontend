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

//*****************************************************
export async function loader({ request, params }: LoaderArgs) {
  //* if user is not logged in, redirect to home
  /* const userId = await getUserId(request);
  if (!userId) return redirect("/"); */

  console.log("🚀 ~ file: mydevices.$box.tsx:150 ~ loader ~ params:", params);

  return json({});
}

//*****************************************************
export async function action({ request }: ActionArgs) {
  return redirect("/");
}

//**********************************
export default function EditBoxSensors() {
  return (
    <div className="grid grid-rows-1">
      {/* gerneral form */}
      <div className="flex min-h-full items-center justify-center">
        <div className="mx-auto w-full max-w-5xl font-helvetica">
          {/* Heading */}
          <div className="inline-flex">
            {/* View title */}
            <div>
              <h1 className="mt-2 text-4xl">Sensors</h1>
            </div>
          </div>

          {/* divider */}
          <hr className="my-2 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}
