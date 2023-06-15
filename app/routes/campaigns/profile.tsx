import { Form, useActionData, useLoaderData } from "@remix-run/react";
import {
  ActionArgs,
  LoaderArgs,
  json,
  redirect,
} from "@remix-run/server-runtime";
import {
  getOwnCampaigns,
  deleteCampaign,
  updateCampaign,
} from "~/models/campaign.server";
import { requireUserId } from "~/session.server";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "~/components/ui/button";
import invariant from "tiny-invariant";
import { Switch } from "~/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Exposure, Priority } from "@prisma/client";
import { useToast } from "~/components/ui/use-toast";
import {
  campaignSchema,
  campaignUpdateSchema,
} from "~/lib/validations/campaign";

type PriorityType = keyof typeof Priority;
type ExposureType = keyof typeof Exposure;

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request);
  const campaigns = await getOwnCampaigns(userId);
  // const data = await campaigns.json();
  // if (data.code === "UnprocessableEntity") {
  //   throw new Response("Campaigns not found", { status: 502 });
  // }
  return json(campaigns);
}
export async function action(args: ActionArgs) {
  const formData = await args.request.clone().formData();
  const _action = formData.get("_action");
  if (_action === "DELETE") {
    return deleteAction(args);
  }
  if (_action === "UPDATE") {
    return updateAction(args);
  }
  throw new Error("Unknown action");
}

async function updateAction({ request }: ActionArgs) {
  const ownerId = await requireUserId(request);
  console.log(ownerId);
  const formData = await request.formData();
  const campaignId = formData.get("campaignId");
  if (!campaignId) {
    return;
  }
  const title = formData.get("title");
  console.log(title);
  const description = formData.get("description");
  const begin = formData.get("startDate");
  const startDate =
    begin && typeof begin === "string" ? new Date(begin) : undefined;
  const end = formData.get("endDate");
  const endDate = end && typeof end === "string" ? new Date(end) : undefined;
  const createdAt = new Date();
  const updatedAt = new Date();
  const phenomenaString = formData.get("phenomena");
  const phenomena = [""];
  // let phenomenaState: PhenomenaState = {};
  // if (typeof phenomenaString === "string") {
  //   phenomenaState = JSON.parse(phenomenaString);
  // }
  // const phenomena = Object.keys(phenomenaState).filter(
  //   (key) => phenomenaState[key]
  // );

  const priority = formData.get("priority") as PriorityType;
  const exposure = formData.get("exposure") as ExposureType;
  const hardware_available =
    formData.get("hardware_available") === "on" ? true : false;
  let requiredParticipants: FormDataEntryValue | null | number = formData.get(
    "requiredParticipants"
  );
  let requiredSensors: FormDataEntryValue | null | number =
    formData.get("requiredSensors");
  if (typeof requiredParticipants === "string") {
    requiredParticipants = parseInt(requiredParticipants);
  }
  if (typeof requiredSensors === "string") {
    requiredSensors = parseInt(requiredSensors);
  }

  const campaignData = {
    title,
    description,
    priority,
    participantCount: 0,
    requiredParticipants: requiredParticipants || null,
    requiredSensors: requiredSensors || null,
    createdAt,
    updatedAt,
    startDate,
    endDate,
    phenomena,
    exposure,
    hardware_available,
    //   centerpoint,
    owner: {
      id: ownerId,
    },
    ownerId,
  };

  try {
    // const newCampaign = campaignUpdateSchema.parse(campaignData);
    // const campaign = await updateCampaign(
    //   String(campaignId),
    //   campaignData.description
    // );

    return redirect("/campaigns/overview");
  } catch (error) {
    console.error(`form not submitted ${error}`);
    return json({ error });
  }
}

async function deleteAction({ request }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const campaignId = formData.get("campaignId");
  invariant(campaignId, "Campaign not found");

  const deletedCampaign = await deleteCampaign({
    ownerId: userId,
    id: campaignId as string,
  });
  redirect(".");
  return json({ deleted: true });
}

export default function Profile() {
  // const [phenomenaState, setPhenomenaState] = useState(
  //     Object.fromEntries(phenomena.map((p: string) => [p, false]))
  //   );
  const { toast } = useToast();
  const [priority, setPriority] = useState("MEDIUM");
  const [exposure, setExposure] = useState("UNKNOWN");
  const actionData = useActionData();
  const data = useLoaderData<typeof loader>();

  useEffect(() => {
    console.log(actionData);
    if (actionData && actionData.deleted) {
      toast({
        title: "Campaign was deleted successfully!",
      });
    }
    if (actionData && actionData.updated) {
      toast({
        title: "Campaign was updated successfully",
      });
    }
  }, [actionData, toast]);

  return (
    <div className="h-full w-full">
      <h1>Your campaigns: </h1>
      <div className="flex flex-col gap-4">
        {data.map((c) => {
          return (
            <Card className="w-[260px]" key={c.id}>
              <CardHeader>
                <CardTitle>{c.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form method="post">
                  <input
                    type="text"
                    className="hidden"
                    name="campaignId"
                    value={c.id}
                    readOnly
                  />
                  <button
                    name="_action"
                    value="DELETE"
                    className="hover:bg-red-600 focus:bg-red-400 float-right my-2 rounded bg-red-500 py-2 px-4 text-white"
                    type="submit"
                  >
                    Delete
                  </button>
                </Form>
              </CardContent>
              <CardFooter>
                <Accordion className="w-full" type="single" collapsible>
                  <AccordionItem value="edit">
                    <AccordionTrigger className="text-blue-600 hover:text-blue-800">
                      Edit
                    </AccordionTrigger>
                    <AccordionContent>
                      <Form method="post" className="space-y-6" noValidate>
                        <div>
                          <input
                            type="text"
                            className="hidden"
                            name="campaignId"
                            value={c.id}
                            readOnly
                          />
                          <label
                            htmlFor="title"
                            className="block text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']"
                          >
                            Title
                          </label>
                          <div className="mt-1">
                            <input
                              // ref={titleRef}
                              id="title"
                              autoFocus={true}
                              name="title"
                              type="title"
                              autoComplete="title"
                              aria-invalid={
                                actionData?.error?.issues[0].message
                                  ? true
                                  : undefined
                              }
                              aria-describedby="title-error"
                              className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                            />
                            {actionData?.error?.issues[0].path[0] ===
                              "title" && (
                              <div
                                className="pt-1 text-red-500"
                                id="email-error"
                              >
                                {actionData.error.issues[0].message}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* <input
            id="feature"
            value={JSON.stringify(features)}
            name="feature"
            type="text"
            className="hidden"
          /> */}

                        <div>
                          <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']"
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
                              aria-invalid={
                                actionData?.error?.issues[0].message
                                  ? true
                                  : undefined
                              }
                              aria-describedby="description-error"
                              className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                            />
                            {actionData?.error?.issues[0].path[0] ===
                              "description" && (
                              <div
                                className="pt-1 text-red-500"
                                id="description-error"
                              >
                                {actionData.error.issues[0].message}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="mt-1">
                            <input
                              name="priority"
                              type="hidden"
                              value={priority}
                            />
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
                                      <DropdownMenuRadioItem
                                        key={key}
                                        value={key}
                                      >
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
                            htmlFor="requiredParticipants"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Gewünschte Teilnehmerzahl
                          </label>
                          <div className="mt-1">
                            <input
                              id="requiredParticipants"
                              // ref={requiredParticipantsRef}
                              name="requiredParticipants"
                              type="number"
                              autoComplete="new-requiredParticipants"
                              aria-invalid={
                                actionData?.error?.issues[0].message
                                  ? true
                                  : undefined
                              }
                              aria-describedby="requiredParticipants-error"
                              className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                            />
                            {actionData?.error?.issues[0].path[0] ===
                              "requiredParticipants" && (
                              <div
                                className="pt-1 text-red-500"
                                id="description-error"
                              >
                                {actionData.error.issues[0].message}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="requiredSensors"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Gewünschte Anzahl Sensoren
                          </label>
                          <div className="mt-1">
                            <input
                              id="requiredSensors"
                              // ref={requiredSensorsRef}
                              name="requiredSensors"
                              type="number"
                              autoComplete="new-requiredSensors"
                              aria-invalid={
                                actionData?.error?.issues[0].message
                                  ? true
                                  : undefined
                              }
                              aria-describedby="requiredSensors-error"
                              className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                            />
                            {actionData?.error?.issues[0].path[0] ===
                              "requiredSensors" && (
                              <div
                                className="pt-1 text-red-500"
                                id="description-error"
                              >
                                {actionData.error.issues[0].message}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* <div>
            <label
              htmlFor="country"
              className="block text-sm font-medium text-gray-700"
            >
              Land
            </label>
            <div className="mt-1">
              <input
                id="country"
                // ref={countryRef}
                name="country"
                type="country"
                autoComplete="new-country"
                // aria-invalid={actionData?.errors?.country ? true : undefined}
                aria-describedby="country-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {/* {actionData?.errors?.country && (
                <div className="text-red-700 pt-1" id="country-error">
                  {actionData.errors.country}
                </div>
              )} */}
                        {/* </div>
          </div> */}
                        <div>
                          <label
                            htmlFor="startDate"
                            className="block text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']"
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
                              aria-invalid={
                                actionData?.error?.issues[0].message
                                  ? true
                                  : undefined
                              }
                              aria-describedby="startDate-error"
                              className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                            />
                            {actionData?.error?.issues[0].path[0] ===
                              "startDate" && (
                              <div
                                className="pt-1 text-red-500"
                                id="description-error"
                              >
                                {actionData.error.issues[0].message}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="endDate"
                            className="block text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']"
                          >
                            endDate
                          </label>
                          <div className="mt-1">
                            <input
                              id="endDate"
                              // ref={endDateRef}
                              name="endDate"
                              type="date"
                              autoComplete="new-endDate"
                              aria-invalid={
                                actionData?.error?.issues[0].message
                                  ? true
                                  : undefined
                              }
                              aria-describedby="endDate-error"
                              className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                            />
                            {actionData?.error?.issues[0].message ===
                              "Start date must be earlier than End date." && (
                              <div
                                className="pt-1 text-red-500"
                                id="description-error"
                              >
                                {actionData.error.issues[0].message}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button className="w-full" variant="outline">
                                Phenomena{" "}
                                <span className="text-red-500">&nbsp;*</span>
                                <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200" />
                              </Button>
                            </DropdownMenuTrigger>
                            {/* <DropdownMenuContent className="w-56">
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
              </DropdownMenuContent> */}
                          </DropdownMenu>
                        </div>
                        <div className="mt-1">
                          <input
                            name="exposure"
                            type="hidden"
                            value={exposure}
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button className="w-full" variant="outline">
                                Exposure{" "}
                                <span className="text-red-500">&nbsp;*</span>
                                <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                              <DropdownMenuRadioGroup
                                value={exposure}
                                onValueChange={setExposure}
                              >
                                <DropdownMenuRadioItem value={"INDOOR"}>
                                  Indoor
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value={"MOBILE"}>
                                  Mobil
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value={"OUTDOOR"}>
                                  Outdoor
                                </DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <label
                          className="after:text-red-500 after:content-['_*']"
                          htmlFor="hardware_available"
                        >
                          Hardware verfügbar
                        </label>
                        <Switch
                          id="hardware_available"
                          name="hardware_available"
                        />
                        {/* <input
            type="hidden"
            name="phenomena"
            value={JSON.stringify(phenomenaState)}
          /> */}

                        <button
                          name="_action"
                          value="UPDATE"
                          type="submit"
                          className="hover:bg-blue-600 focus:bg-blue-400 w-full  rounded bg-blue-500 py-2 px-4 text-white"
                        >
                          Update Campaign
                        </button>
                      </Form>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
