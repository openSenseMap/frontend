import { Form, Link, useLoaderData } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import type { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useContext, useState } from "react";
import { Button } from "~/components/ui/button";
import { ChevronDown } from "lucide-react";
import { createCampaign } from "~/models/campaign.server";
import { requireUserId } from "~/session.server";
import { FeatureContext } from "../create";
import { Priority } from "@prisma/client";
import * as turf from "@turf/helpers";
import center from "@turf/center";
import { campaignSchema } from "~/lib/validations/campaign";
import * as z from "zod";

type Checked = DropdownMenuCheckboxItemProps["checked"];

interface PhenomenaState {
  [phenomena: string]: boolean;
}

type PriorityType = keyof typeof Priority;
type FormData = z.infer<typeof campaignSchema>;

export async function action({ request }: ActionArgs) {
  const ownerId = await requireUserId(request);
  const formData = await request.formData();
  const area = formData.get("feature") as any;
  const feature = area ? JSON.parse(area) : null;
  const turf_points = feature
    ? turf.points(feature[0].geometry.coordinates[0])
    : null;
  const centerpoint = turf_points ? center(turf_points) : {};
  const title = formData.get("title");
  const description = formData.get("description");
  const formDataKeywords = formData.get("keywords");
  let keywords;
  if (formDataKeywords && typeof formDataKeywords === "string") {
    keywords = formDataKeywords.split(" ");
  }
  const location = formData.get("location");
  const begin = formData.get("startDate");
  const startDate =
    begin && typeof begin === "string" ? new Date(begin) : undefined;
  const end = formData.get("endDate");
  const endDate = end && typeof end === "string" ? new Date(end) : undefined;
  const createdAt = new Date();
  const updatedAt = new Date();
  const phenomenaString = formData.get("phenomena");
  let phenomenaState: PhenomenaState = {};
  if (typeof phenomenaString === "string") {
    phenomenaState = JSON.parse(phenomenaString);
  }
  const phenomena = Object.keys(phenomenaState).filter(
    (key) => phenomenaState[key]
  );

  const priority = formData.get("priority") as PriorityType;

  const campaignData = {
    title,
    description,
    feature,
    keywords: keywords || [],
    priority,
    location,
    participantCount: 0, // assuming this is a default value
    createdAt,
    updatedAt,
    startDate,
    endDate,
    phenomena,
    centerpoint,
    owner: {
      id: ownerId,
    },
    ownerId,
  };

  try {
    const newCampaign = campaignSchema.parse(campaignData);
    const campaign = await createCampaign({
      ...newCampaign,
      feature: newCampaign.feature ?? {},
      endDate: newCampaign.endDate ?? null,
      centerpoint: newCampaign.centerpoint ?? {},
      ownerId,
    });

    return redirect("/campaigns/");
  } catch (error) {
    console.error(`form not submitted ${error}`);
    return json({ error });
  }
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
  const { features } = useContext(FeatureContext);
  console.log(features);
  const [phenomenaState, setPhenomenaState] = useState(
    Object.fromEntries(phenomena.map((p: string) => [p, false]))
  );
  const [priority, setPriority] = useState("MEDIUM");

  console.log(priority);

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
          <input
            id="feature"
            value={JSON.stringify(features)}
            name="feature"
            type="text"
            className="hidden"
          />

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
              htmlFor="keywords"
              className="block text-sm font-medium text-gray-700"
            >
              Keywords
            </label>
            <div className="mt-1">
              <input
                id="keywords"
                defaultValue=""
                placeholder="Seperate keywords by space"
                // ref={keywordsRef}
                name="keywords"
                type="text"
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
            <div className="mt-1">
              <input name="priority" type="hidden" value={priority} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-full" variant="outline">
                    Priority
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuRadioGroup
                    value={priority}
                    onValueChange={setPriority}
                  >
                    {Object.keys(Priority).map((key: string) => {
                      return (
                        <DropdownMenuRadioItem key={key} value={key}>
                          {key}
                        </DropdownMenuRadioItem>
                      );
                    })}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
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
                type="date"
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
                type="date"
                autoComplete="new-phenomena"
                // aria-invalid={actionData?.errors?.phenomena ? true : undefined}
                aria-describedby="phenomena-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {/* {actionData?.errors?.phenomena && (
                <div className="text-red-700 pt-1" id="phenomena-error">
                  {actionData.errors.phenomena}
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
          <input
            type="hidden"
            name="phenomena"
            value={JSON.stringify(phenomenaState)}
          />

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
