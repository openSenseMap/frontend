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
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  console.log("🚀 ~ file: mydevices.$box.tsx:15 ~ loader ~ params:", params);

  return json({});
}

//*****************************************************
export async function action({ request }: ActionArgs) {
  return redirect("/");
}

//**********************************
export default function EditBox() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="my-6 mb-2 border-b-2 text-center text-3xl">Blog Admin</h1>

      <div className="grid grid-cols-4 gap-6">
        <nav className="col-span-4 md:col-span-1">
          <ul>
            <li>
              <Link to="new" className="text-blue-600 underline">
                ➕ Create New Post1
              </Link>
            </li>
            <li>
              <Link to="new" className="text-blue-600 underline">
                ➕ Create New Post2
              </Link>
            </li>
            <li>
              <Link to="new" className="text-blue-600 underline">
                ➕ Create New Post3
              </Link>
            </li>
            <li>
              <Link to="new" className="text-blue-600 underline">
                ➕ Create New Post4
              </Link>
            </li>
          </ul>
        </nav>

        <main className="col-span-4 md:col-span-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
