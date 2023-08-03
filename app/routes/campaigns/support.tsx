import { Form } from "@remix-run/react";
import {
  InformationCircleIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/solid";
import { FileWithPath, useDropzone, DropzoneOptions } from "react-dropzone";
import { useState, useCallback } from "react";
import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FileTypes = {
  [key: string]: string[];
};

export async function action({ request }: ActionArgs) {
  const ownerId = await requireUserId(request);
  const formData = await request.formData();
  console.log(formData);
  const description = formData.get("description");
  const detailed_description = formData.get("detailed_description");
  const email = formData.get("email");
  const files = formData.get("files");
  const campaignId = formData.get("campaignId");
  const edge = formData.get("edge");
  console.log(edge);

  return redirect("/campaigns/overview");
}

export default function Support() {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
    console.log("Dropped files:", acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      image: [".jpeg", ".png", ".gif", "image/jpeg", "image/png", "image/gif"],
    } as FileTypes,
  });

  const filesList = () =>
    files.map((file) => (
      <li key={file.name}>
        {file.name} - {file.size} bytes
      </li>
    ));

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="w-full text-center">
        <p>
          Nutzen Sie dieses Formular um technische Unterstützung bei Problemen
          zu erhalten, <br /> die beim Erstellen oder Verwalten von Kampagnen
          auftreten.
        </p>
      </div>
      <div className="mx-auto mt-2 w-full max-w-md px-8">
        <Form method="post" className="space-y-6" noValidate>
          <div>
            <div className="my-2 rounded bg-blue-500 text-white">
              <InformationCircleIcon className="float-right m-1 h-6 w-6" />
              <p className="p-4">
                Es tut uns Leid, dass Sie auf ein Problem gestoßen sind! Bitte
                geben Sie hier möglichst viele Informationen darüber an, wie
                dieses Problem aufgetreten ist. Dies hilft uns bei der
                effizienten Behebung des Problems.
              </p>
            </div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <div className="mt-1">
              <input
                // ref={descriptionRef}
                id="description"
                required
                autoFocus={true}
                maxLength={180}
                name="description"
                type="description"
                autoComplete="description"
                // aria-invalid={actionData?.errors?.description ? true : undefined}
                aria-describedby="description-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {/* {actionData?.errors?.description && (
                    <div className="text-red-700 pt-1" id="email-error">
                      {actionData.errors.email}
                    </div>
                  )} */}
            </div>
          </div>
          <label
            htmlFor="detailed-description"
            className="block text-sm font-medium text-gray-700"
          >
            Describe in more detail
          </label>
          <div className="mt-1">
            <textarea
              // ref={detailed-descriptionRef}
              id="detailed-description"
              required
              autoFocus={true}
              name="detailed-description"
              autoComplete="detailed-description"
              // aria-invalid={actionData?.errors?.detailed-description ? true : undefined}
              aria-describedby="detailed-description-error"
              className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
            />
            {/* {actionData?.errors?.detailed-description && (
                    <div className="text-red-700 pt-1" id="email-error">
                      {actionData.errors.email}
                    </div>
                  )} */}
          </div>

          <div
            {...getRootProps()}
            className={`rounded-md border-2 border-dashed p-4 text-center hover:cursor-pointer hover:border-blue-500 ${
              isDragActive ? "border-blue-500" : "border-gray-300"
            }`}
          >
            <input {...getInputProps()} name="files" />
            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <p>Drag 'n' drop some files here, or click to select files</p>
            )}
            <ul>{filesList()}</ul>
          </div>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Browser</CardTitle>
              <CardDescription>
                In welchen Browsern treten die Probleme auf
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <input id="chrome" name="chrome" type="radio" />
                <label
                  htmlFor="chrome"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Chrome
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input id="edge" name="edge" type="radio" />
                <label
                  htmlFor="Edge"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Edge
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input id="firefox" name="firefox" type="radio" />
                <label
                  htmlFor="Firefox"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Firefox
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input id="explorer" name="explorer" type="radio" />

                <label
                  htmlFor="explorer"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Internet Explorer
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input id="opera" name="opera" type="radio" />

                <label
                  htmlFor="Opera"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Opera
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input id="safari" name="safari" type="radio" />

                <label
                  htmlFor="Safari"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Safari
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input id="other" name="other" type="radio" />

                <label
                  htmlFor="Sonstige"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Sonstige
                </label>
              </div>
            </CardContent>
          </Card>

          {/* <input type="hidden" name="redirectTo" value={redirectTo} /> */}
          <button
            type="submit"
            className="hover:bg-blue-600 focus:bg-blue-400 w-full  rounded bg-blue-500 px-4 py-2 text-white"
          >
            Abschicken
          </button>
        </Form>
      </div>
    </div>
  );
}
