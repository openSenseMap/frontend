import { Form, Link, useLoaderData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { ChevronDown } from "lucide-react";

type Checked = DropdownMenuCheckboxItemProps["checked"];

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  console.log(formData);
  const title = formData.get("title");
  const description = formData.get("description");
  const phenomena = formData.get("phenomena");
  console.log(phenomena);
  return;
}

export async function loader({ params }: LoaderArgs) {
  // request to fetch all phenomena
  const response = await fetch("https://api.sensors.wiki/phenomena/all");
  const data = await response.json();
  if (data.code === "UnprocessableEntity") {
    throw new Response("Phenomena not found", { status: 502 });
  }
  const phenomena = data.map(
    (d: { label: { item: { text: any }[] } }) => d.label.item[0].text
  );
  return phenomena;
}

export default function CreateCampaign() {
  const phenomena = useLoaderData<typeof loader>();
  const [phenomenaState, setPhenomenaState] = useState(
    Object.fromEntries(phenomena.map((p: any) => [p, false]))
  );

  console.log(phenomenaState);

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <Form method="post" className="space-y-6" noValidate>
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <div className="mt-1">
              <input
                // ref={titleRef}
                id="title"
                required
                autoFocus={true}
                name="title"
                type="title"
                autoComplete="title"
                // aria-invalid={actionData?.errors?.title ? true : undefined}
                aria-describedby="title-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {/* {actionData?.errors?.title && (
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
          <div>
            <label
              htmlFor="polygonDraw"
              className="block text-sm font-medium text-gray-700"
            >
              PolygonDraw
            </label>
            <div className="mt-1">
              <input
                id="polygonDraw"
                // ref={polygonDrawRef}
                name="polygonDraw"
                type="polygonDraw"
                autoComplete="new-polygonDraw"
                // aria-invalid={actionData?.errors?.polygonDraw ? true : undefined}
                aria-describedby="polygonDraw-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {/* {actionData?.errors?.polygonDraw && (
                <div className="text-red-700 pt-1" id="polygonDraw-error">
                  {actionData.errors.polygonDraw}
                </div>
              )} */}
            </div>
          </div>
          <div>
            <label
              htmlFor="keywords"
              className="block text-sm font-medium text-gray-700"
            >
              Keywords
            </label>
            <div className="mt-1">
              <input
                id="keywords"
                // ref={keywordsRef}
                name="keywords"
                type="keywords"
                autoComplete="new-keywords"
                // aria-invalid={actionData?.errors?.keywords ? true : undefined}
                aria-describedby="keywords-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {/* {actionData?.errors?.keywords && (
                <div className="text-red-700 pt-1" id="keywords-error">
                  {actionData.errors.keywords}
                </div>
              )} */}
            </div>
          </div>
          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-gray-700"
            >
              Priority
            </label>
            <div className="mt-1">
              <input
                id="priority"
                // ref={priorityRef}
                name="priority"
                type="priority"
                autoComplete="new-priority"
                // aria-invalid={actionData?.errors?.priority ? true : undefined}
                aria-describedby="priority-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {/* {actionData?.errors?.priority && (
                <div className="text-red-700 pt-1" id="priority-error">
                  {actionData.errors.priority}
                </div>
              )} */}
            </div>
          </div>
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700"
            >
              Location
            </label>
            <div className="mt-1">
              <input
                id="location"
                // ref={locationRef}
                name="location"
                type="location"
                autoComplete="new-location"
                // aria-invalid={actionData?.errors?.location ? true : undefined}
                aria-describedby="location-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {/* {actionData?.errors?.location && (
                <div className="text-red-700 pt-1" id="location-error">
                  {actionData.errors.location}
                </div>
              )} */}
            </div>
          </div>
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700"
            >
              startDate
            </label>
            <div className="mt-1">
              <input
                id="startDate"
                // ref={startDateRef}
                name="startDate"
                type="startDate"
                autoComplete="new-startDate"
                // aria-invalid={actionData?.errors?.startDate ? true : undefined}
                aria-describedby="startDate-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {/* {actionData?.errors?.startDate && (
                <div className="text-red-700 pt-1" id="startDate-error">
                  {actionData.errors.startDate}
                </div>
              )} */}
            </div>
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700"
            >
              endDate
            </label>
            <div className="mt-1">
              <input
                id="endDate"
                // ref={endDateRef}
                name="endDate"
                type="endDate"
                autoComplete="new-endDate"
                // aria-invalid={actionData?.errors?.endDate ? true : undefined}
                aria-describedby="endDate-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {/* {actionData?.errors?.endDate && (
                <div className="text-red-700 pt-1" id="endDate-error">
                  {actionData.errors.endDate}
                </div>
              )} */}
            </div>
          </div>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full" variant="outline">
                  Phenomena
                  <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {phenomena.map((p: any) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={p}
                      checked={phenomenaState[p]}
                      onCheckedChange={() =>
                        setPhenomenaState({
                          ...phenomenaState,
                          [p]: !phenomenaState[p],
                        })
                      }
                    >
                      {p}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
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
