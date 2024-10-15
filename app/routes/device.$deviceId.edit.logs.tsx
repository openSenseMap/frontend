// app/routes/device.$deviceId.edit.logs.tsx
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useOutletContext,
} from "@remix-run/react";
import { Save, Trash } from "lucide-react";
import React, { useEffect, useState } from "react";
import { typedjson } from "remix-typedjson";
import invariant from "tiny-invariant";
import ErrorMessage from "~/components/error-message";
import {
  createLogEntry,
  deleteLogEntry,
  getLogEntriesByDeviceId,
} from "~/models/log-entry.server";
import type { LogEntry } from "~/schema/log-entry";
import { getUserId } from "~/session.server";

//*****************************************************
export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (!userId) return redirect("/");

  const deviceID = params.deviceId;
  if (typeof deviceID !== "string") {
    return json("deviceID not found");
  }

  const logEntries = await getLogEntriesByDeviceId(deviceID);
  return typedjson(logEntries);
}

//*****************************************************
export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const { intent, content } = Object.fromEntries(formData);

  const deviceID = params.deviceId;
  invariant(typeof deviceID === "string", "Device ID not found.");

  switch (intent) {
    case "addLog": {
      invariant(typeof content === "string", "Log content is required.");
      await createLogEntry({ deviceId: deviceID, content, public: false });
      return redirect(`/device/${deviceID}/edit/logs`); // Redirect to the same logs page
    }
    case "deleteLog": {
      const logEntryId = formData.get("logEntryId");
      invariant(typeof logEntryId === "string", "Log entry ID is required.");
      await deleteLogEntry(logEntryId);
      return redirect(`/device/${deviceID}/edit/logs`); // Redirect to the same logs page
    }
  }

  return redirect("");
}

//**********************************
export default function Logs() {
  const { __obj__: logEntries } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [newLogContent, setNewLogContent] = useState(""); // For the new log input
  const [setToastOpen] = useOutletContext<[(_open: boolean) => void]>();

  useEffect(() => {
    if (actionData) {
      setToastOpen(true); // Show toast if there's an action result
    }
  }, [actionData, setToastOpen]);

  return (
    <div className="grid grid-rows-1">
      <div className="flex min-h-full items-cenater justify-center">
        <div className="mx-auto w-full font-helvetica">
          <h1 className="text-4xl">Device Logs</h1>

          {/* Form to add a new log */}
          <Form method="post" noValidate className="mt-4">
            <div className="flex space-x-2">
              <input
                name="content"
                type="text"
                placeholder="Enter log content"
                value={newLogContent}
                onChange={(e) => setNewLogContent(e.target.value)}
                className="w-full rounded border border-gray-200 px-2 py-1 text-base"
              />
              <button
                type="submit"
                name="intent"
                value="addLog"
                className="h-12 w-12 rounded-full border border-gray-300 hover:bg-gray-200"
              >
                <Save className="mx-auto h-5 w-5" />
              </button>
            </div>
          </Form>

          {/* Logs list */}
          {logEntries && (
            <div className="mt-6 space-y-4">
              {logEntries.map((logEntry: LogEntry) => (
                <div
                  key={logEntry.id}
                  className="flex justify-between items-center p-2 border rounded"
                >
                  <p>{logEntry.content}</p>
                  <Form method="post">
                    <input
                      type="hidden"
                      name="logEntryId"
                      value={logEntry.id}
                    />
                    <button
                      type="submit"
                      name="intent"
                      value="deleteLog"
                      className="text-red-500 hover:underline"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </Form>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Error Boundary for the Logs component
export function ErrorBoundary() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ErrorMessage />
    </div>
  );
}
