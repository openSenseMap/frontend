import { Form, Link } from "@remix-run/react";

export default function CreateCampaign() {
  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <Form method="post" className="space-y-6" noValidate>
          <div>
            <label
              htmlFor="author"
              className="block text-sm font-medium text-gray-700"
            >
              Author
            </label>
            <div className="mt-1">
              <input
                // ref={emailRef}
                id="author"
                required
                autoFocus={true}
                name="author"
                type="author"
                autoComplete="author"
                // aria-invalid={actionData?.errors?.author ? true : undefined}
                aria-describedby="author-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {/* {actionData?.errors?.author && (
                <div className="text-red-700 pt-1" id="email-error">
                  {actionData.errors.email}
                </div>
              )} */}
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <div className="mt-1">
              <input
                id="description"
                // ref={descriptionRef}
                name="description"
                type="description"
                autoComplete="new-description"
                // aria-invalid={actionData?.errors?.description ? true : undefined}
                aria-describedby="description-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {/* {actionData?.errors?.description && (
                <div className="text-red-700 pt-1" id="description-error">
                  {actionData.errors.description}
                </div>
              )} */}
            </div>
          </div>

          {/* <input type="hidden" name="redirectTo" value={redirectTo} /> */}
          <button
            type="submit"
            className="hover:bg-blue-600 focus:bg-blue-400 w-full  rounded bg-blue-500 py-2 px-4 text-white"
          >
            Create Campaign
          </button>
          <div className="flex items-center justify-center">
            <Link
              className="text-blue-500 underline"
              to={{
                pathname: "../campaigns",
              }}
            >
              Kampagnen Übersicht
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
