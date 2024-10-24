import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import { Save, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { typedjson } from "remix-typedjson";
import invariant from "tiny-invariant";
import ErrorMessage from "~/components/error-message";
import {
  createLogEntry,
  deleteLogEntry,
  getLogEntriesByDeviceId,
  updateLogEntryVisibility,
} from "~/models/log-entry.server";
import type { LogEntry } from "~/schema/log-entry";
import { getUserId } from "~/session.server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "~/components/ui/use-toast";

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

export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const { intent, content, logEntryId, isPublic } =
      Object.fromEntries(formData);

    const deviceID = params.deviceId;
    invariant(typeof deviceID === "string", "Device ID not found.");

    switch (intent) {
      case "addLog": {
        invariant(typeof content === "string", "Log content is required.");
        await createLogEntry({ deviceId: deviceID, content, public: false });
        return json({
          success: true,
          message: "Log added successfully!",
        });
      }
      case "deleteLog": {
        invariant(typeof logEntryId === "string", "Log entry ID is required.");
        await deleteLogEntry(logEntryId);
        return json({
          success: true,
          message: "Log deleted successfully!",
        });
      }
      case "togglePublic": {
        invariant(typeof logEntryId === "string", "Log entry ID is required.");
        invariant(typeof isPublic === "string", "Public status is required.");
        await updateLogEntryVisibility(logEntryId, isPublic === "true");
        return json({
          success: true,
          message: "Log visibility updated!",
        });
      }
      default:
        return json({ success: false, message: "Unknown action." });
    }
  } catch (error) {
    console.error("Error processing action:", error);
    return json(
      { success: false, message: "Something went wrong." },
      { status: 500 },
    );
  }
}

export default function Logs() {
  const { __obj__: logEntries } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { toast } = useToast();
  const [newLogContent, setNewLogContent] = useState("");

  const submit = useSubmit();

  // Show toast or message if actionData contains feedback
  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        toast({
          title: actionData.message,
          variant: "success",
        });
      } else {
        toast({
          title: actionData.message,
          variant: "destructive",
        });
      }
    }
  }, [actionData, toast]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-6">Device Logs</h1>

      <Form method="post" noValidate className="mb-8">
        <div className="flex space-x-2">
          <input
            name="content"
            type="text"
            placeholder="Enter log content"
            value={newLogContent}
            onChange={(e) => setNewLogContent(e.target.value)}
            className="flex-grow rounded border border-gray-300 px-3 py-2 text-base"
          />
          <button
            type="submit"
            name="intent"
            value="addLog"
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            <Save className="h-5 w-5" />
          </button>
        </div>
      </Form>

      {logEntries && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Public</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logEntries.map((logEntry: LogEntry) => (
              <TableRow key={logEntry.id}>
                <TableCell>{logEntry.content}</TableCell>
                <TableCell>
                  {new Date(logEntry.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Form method="post">
                    <input
                      type="hidden"
                      name="logEntryId"
                      value={logEntry.id}
                    />
                    <input
                      type="hidden"
                      name="isPublic"
                      value={(!logEntry.public).toString()}
                    />
                    <Switch
                      checked={logEntry.public}
                      onCheckedChange={(event) => {
                        const formData = new FormData();
                        formData.append("logEntryId", logEntry.id);
                        formData.append("isPublic", event.toString());
                        formData.append("intent", "togglePublic");
                        submit(formData, { method: "post" });
                      }}
                    />
                    <button
                      type="submit"
                      name="intent"
                      value="togglePublic"
                      className="hidden"
                    />
                  </Form>
                </TableCell>
                <TableCell>
                  <Form method="post" data-log-id={logEntry.id}>
                    <input
                      type="hidden"
                      name="logEntryId"
                      value={logEntry.id}
                    />
                    <button
                      type="submit"
                      name="intent"
                      value="deleteLog"
                      className="text-destructive hover:text-destructive/90"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </Form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
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
