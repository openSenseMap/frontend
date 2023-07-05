import type {
  ActionArgs,
  LinksFunction,
  LoaderArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useCatch, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { getCampaign } from "~/models/campaign.server";
import { getUserId, requireUserId } from "~/session.server";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "~/components/ui/use-toast";
import { useEffect, useRef, useState } from "react";
import { Map } from "~/components/Map";
import { LayerProps, MapProvider, Source, Layer } from "react-map-gl";
import { campaignSchema } from "~/lib/validations/campaign";
import { Feature } from "geojson";
import { ClockIcon } from "lucide-react";
import clsx from "clsx";
import { valid } from "geojson-validation";
import ShareLink from "~/components/bottom-bar/share-link";
import { ClientOnly } from "remix-utils";
import { MarkdownEditor } from "~/markdown.client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import maplibregl from "maplibre-gl/dist/maplibre-gl.css";
import { Switch } from "~/components/ui/switch";
import { downloadGeojSON } from "~/lib/download-geojson";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Markdown from "markdown-to-jsx";
import {
  publishCommentAction,
  createCampaignEvent,
  deleteCampaignEvent,
  deleteCommentAction,
  updateCampaignEvent,
  updateCommentAction,
} from "~/lib/actions";
import { TrashIcon, EditIcon } from "lucide-react";

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: maplibregl,
    },
  ];
};

export async function action(args: ActionArgs) {
  const formData = await args.request.clone().formData();
  const _action = formData.get("_action");

  switch (_action) {
    case "PUBLISH":
      return publishCommentAction(args);
    case "DELETE":
      return deleteCommentAction(args);
    case "EDIT":
      return updateCommentAction(args);
    case "CREATE_EVENT":
      return createCampaignEvent(args);
    case "DELETE_EVENT":
      return deleteCampaignEvent(args);
    case "UPDATE_EVENT":
      return updateCampaignEvent(args);
    default:
      // Handle the case when _action doesn't match any of the above cases
      // For example, you can throw an error or return a default action
      throw new Error(`Unknown action: ${_action}`);
  }
}

// export async function action({ request }: ActionArgs) {
//   // const ownerId = await requireUserId(request);
//   const formData = await request.formData();
//   console.log(formData);
//   const email = formData.get("email");
//   const hardware = formData.get("hardware");
//   return null;
// }

export const meta: MetaFunction<typeof loader> = ({ params }) => ({
  charset: "utf-8",
  title: "openSenseMap",
  description: `Trage zu dieser Kampagne bei: ${params.slug}`,
  viewport: "width=device-width,initial-scale=1",
});

export async function loader({ request, params }: LoaderArgs) {
  const userId = await requireUserId(request);

  const campaign = await getCampaign({ slug: params.slug ?? "" });
  if (!campaign) {
    throw new Response("Campaign not found", { status: 502 });
  }
  return json({ campaign, userId });
}

const layer: LayerProps = {
  id: "polygon-data",
  type: "fill",
  source: "polygon",
  paint: {
    "fill-color": "#5394d0",
    "fill-opacity": 0.7,
  },
};

export default function CampaignId() {
  const data = useLoaderData<typeof loader>();
  const campaign = data.campaign;
  const userId = data.userId;
  const [eventEditMode, setEventEditMode] = useState(false);
  const [editEventTitle, setEditEventTitle] = useState<string | undefined>("");
  const [editEventDescription, setEditEventDescription] = useState<
    string | undefined
  >("");
  const [editEventStartDate, setEditEventStartDate] = useState<
    Date | undefined
  >();
  const [editEventEndDate, setEditEventEndDate] = useState<Date | undefined>();
  const [comment, setComment] = useState<string | undefined>("");
  const [editComment, setEditComment] = useState<string | undefined>("");
  const [editCommentId, setEditCommentId] = useState<string | undefined>("");
  const [eventDescription, setEventDescription] = useState<string | undefined>(
    ""
  );

  const [showMap, setShowMap] = useState(true);
  const [tabView, setTabView] = useState<"overview" | "calendar" | "comments">(
    "overview"
  );
  const textAreaRef = useRef();
  const eventTextAreaRef = useRef();
  const { toast } = useToast();
  const participate = () => {};
  // useEffect(() => {
  //   toast({
  //     title: "HELLO",
  //   });
  // }, []);

  return (
    <div className="h-full w-full">
      <div className="float-right flex gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Teilnehmen</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Teilnehmen</DialogTitle>
              <DialogDescription>
                <p className="font-bold">
                  Indem Sie auf Teilnehmen klicken stimmen Sie zu, dass Sie der
                  Kampagnenleiter unter der von Ihnen angegebenen Email- Adresse
                  kontaktieren darf!
                </p>
                <p className="mt-2">
                  Bitte gib ausserdem an, ob du bereits über die benötigte
                  Hardware verfügst.
                </p>
              </DialogDescription>
            </DialogHeader>
            <Form method="post">
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-row flex-wrap justify-between">
                  <label htmlFor="email" className="text-right">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    className="autofocus w-2/3 border border-gray-400"
                  />
                </div>
                <div className="flex">
                  <label htmlFor="hardware" className="text-right">
                    Hardware vorhanden
                  </label>
                  <input
                    id="hardware"
                    name="hardware"
                    type="checkbox"
                    className="ml-auto"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Teilnehmen</Button>
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Teilen</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Teilen</DialogTitle>
              <DialogDescription>
                <ShareLink />
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <Button
          variant="outline"
          // @ts-ignore
          onClick={() => downloadGeojSON(campaign.feature[0])}
        >
          GeoJSON herunterladen
        </Button>
        <div>
          <span>Karte anzeigen</span>
          <Switch
            id="showMapSwitch"
            checked={showMap}
            onCheckedChange={() => setShowMap(!showMap)}
          />
        </div>
      </div>
      <div className="flex items-center">
        <h1 className="mt-6 mb-2 text-lg font-bold capitalize">
          <b>{campaign.title}</b>
        </h1>
        <span
          className={clsx(
            " ml-4 flex h-6 w-fit items-center rounded px-2 py-1 text-sm text-white",
            {
              "bg-red-500": campaign.priority.toLowerCase() === "urgent",
              "bg-yellow-500": campaign.priority.toLowerCase() === "high",
              "bg-blue-500": campaign.priority.toLowerCase() === "medium",
              "bg-green-500": campaign.priority.toLowerCase() === "low",
            }
          )}
        >
          <ClockIcon className="h-4 w-4" /> {campaign.priority}
        </span>
      </div>
      <div className={`${showMap ? "grid grid-cols-2" : "w-full"}`}>
        <Tabs defaultValue={tabView} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">
              {/* <Clock className="h-5 w-5 pr-1" />
                {t("live_label")} */}
              <Button variant="outline">Übersicht</Button>
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Button variant="outline">Kalender</Button>
            </TabsTrigger>
            <TabsTrigger value="comments">
              <Button variant="outline">Fragen und Kommentare</Button>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <h2 className=" ml-4 mb-4 font-bold">Beschreibung</h2>
            <Markdown>{campaign.description}</Markdown>
          </TabsContent>
          <TabsContent value="calendar">
            {campaign.events.length === 0 && (
              <div className="mx-auto w-full max-w-md px-8">
                {" "}
                <p>
                  Noch keine Events für diese Kampagne. Erstelle ein Event:{" "}
                </p>
                <Form className="space-y-6" method="post">
                  <div>
                    <label htmlFor="title">
                      <span className="text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']">
                        Titel
                      </span>
                    </label>
                    <div className="mt-1 w-full">
                      <input
                        className="w-full"
                        id="title"
                        name="title"
                        type="text"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="description">
                      <span className="text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']">
                        Beschreibung
                      </span>
                    </label>
                    <div className="mt-1">
                      <textarea
                        className="hidden"
                        value={eventDescription}
                        id="description"
                        name="description"
                      ></textarea>
                      <ClientOnly>
                        {() => (
                          <>
                            <MarkdownEditor
                              textAreaRef={eventTextAreaRef}
                              comment={eventDescription}
                              setComment={setEventDescription}
                            />
                            <div className="w-100 border-blue-grey relative flex justify-between rounded-b-lg border border-l border-r border-t-0 px-2 py-1 shadow-md">
                              <span className="text-gray text-xs leading-4">
                                Bild hinzufügen
                              </span>
                              <span className="text-gray text-xs leading-4">
                                Markdown unterstützt
                              </span>
                            </div>
                          </>
                        )}
                      </ClientOnly>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="startDate">
                      <span className="text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']">
                        Beginn
                      </span>
                    </label>
                    <div className="mt-1">
                      <input
                        className="w-full"
                        id="startDate"
                        name="startDate"
                        type="datetime-local"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="startDate">
                      <span className="text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']">
                        Abschluss
                      </span>
                    </label>
                    <div className="mt-1">
                      <input
                        className="w-full"
                        id="endDate"
                        name="endDate"
                        type="datetime-local"
                      />
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <button
                      type="submit"
                      name="_action"
                      value="CREATE_EVENT"
                      className="hover:bg-blue-600 focus:bg-blue-400  rounded bg-blue-500 py-2 px-4 text-white"
                    >
                      CREATE
                    </button>
                  </div>
                </Form>
              </div>
            )}
            {campaign.events.map((e, i) => (
              <Card key={i} className="w-fit min-w-[300px]">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      {eventEditMode ? (
                        <input
                          className="mr-4"
                          type="text"
                          onChange={(e) => setEditEventTitle(e.target.value)}
                          placeholder="Enter new title"
                        />
                      ) : (
                        <p className="mr-4">{e.title}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setEventEditMode(true)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Form method="post">
                        <input
                          className="hidden"
                          id="eventId"
                          name="eventId"
                          type="text"
                          value={e.id}
                        />
                        <Button
                          variant="outline"
                          name="_action"
                          value="DELETE_EVENT"
                          type="submit"
                        >
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </Form>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col">
                  <span className="font-bold">Beschreibung: </span>
                  {eventEditMode ? (
                    <ClientOnly>
                      {() => (
                        <>
                          <MarkdownEditor
                            textAreaRef={eventTextAreaRef}
                            comment={editEventDescription}
                            setComment={setEditEventDescription}
                          />
                          <div className="w-100 border-blue-grey relative flex justify-between rounded-b-lg border border-l border-r border-t-0 px-2 py-1 shadow-md">
                            <span className="text-gray text-xs leading-4">
                              Bild hinzufügen
                            </span>
                            <span className="text-gray text-xs leading-4">
                              Markdown unterstützt
                            </span>
                          </div>
                        </>
                      )}
                    </ClientOnly>
                  ) : (
                    <Markdown>{e.description}</Markdown>
                  )}
                  <span className="font-bold">Beginn: </span>
                  {eventEditMode ? (
                    <input
                      type="datetime-locale"
                      onChange={() => setEditEventStartDate}
                    />
                  ) : (
                    <p>{e.startDate}</p>
                  )}
                  <span className="font-bold">Abschluss: </span>
                  <p>{e.endDate}</p>
                </CardContent>
                {/* {userId === e.ownerId && ( */}
                <CardFooter>
                  <Form method="post" className="space-y-2">
                    <input
                      className="hidden"
                      id="eventId"
                      name="eventId"
                      type="text"
                      value={e.id}
                    />
                    <input
                      className="hidden"
                      id="title"
                      name="title"
                      type="text"
                      value={editEventTitle}
                    />
                    <textarea
                      className="hidden"
                      id="description"
                      name="description"
                      value={editEventDescription}
                    ></textarea>
                    <input
                      className="hidden"
                      id="startDate"
                      name="startDate"
                      type="date"
                      // value={editEventStartDate}
                    />
                    <input
                      // value={editEventEndDate}
                      className="hidden"
                      id="endDate"
                      name="endDate"
                      type="date"
                    />

                    <Button
                      className="float-right"
                      name="_action"
                      value="UPDATE_EVENT"
                      type="submit"
                      onClick={() => setEventEditMode(false)}
                    >
                      ÜBERNEMEN
                    </Button>
                  </Form>
                </CardFooter>
                {/* )} */}
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="comments">
            <h2 className=" ml-4 mb-4 font-bold">Fragen und Kommentare</h2>
            {campaign.comments.map((c: any, i: number) => {
              return (
                <div key={i}>
                  {userId === campaign.ownerId && (
                    <>
                      <Form method="post">
                        <input
                          className="hidden"
                          id="deleteComment"
                          name="deleteComment"
                          value={c.id}
                        />
                        <Button name="_action" value="DELETE" type="submit">
                          Delete
                        </Button>
                      </Form>
                      <Button
                        onClick={() => {
                          setEditCommentId(c.id);
                          setEditComment(c.content);
                        }}
                      >
                        Edit
                      </Button>
                      {editCommentId === c.id && (
                        <ClientOnly>
                          {() => (
                            <div className="container overflow-auto">
                              <MarkdownEditor
                                textAreaRef={textAreaRef}
                                comment={editComment}
                                setComment={setEditComment}
                              />
                              <div className="w-100 border-blue-grey relative flex justify-between rounded-b-lg border border-l border-r border-t-0 px-2 py-1 shadow-md">
                                <span className="text-gray text-xs leading-4">
                                  Bild hinzufügen
                                </span>
                                <span className="text-gray text-xs leading-4">
                                  Markdown unterstützt
                                </span>
                              </div>
                              <Form method="post">
                                <input
                                  className="hidden"
                                  value={c.id}
                                  name="commentId"
                                  id="commentId"
                                />
                                <textarea
                                  className="hidden"
                                  value={editComment}
                                  name="editComment"
                                  id="editComment"
                                ></textarea>
                                <Button
                                  name="_action"
                                  value="EDIT"
                                  type="submit"
                                >
                                  Veröffentlichen
                                </Button>
                              </Form>
                            </div>
                          )}
                        </ClientOnly>
                      )}
                    </>
                  )}
                  <Markdown>{c.content}</Markdown>;
                </div>
              );
            })}
            {!editComment && (
              <ClientOnly>
                {() => (
                  <div className="container overflow-auto">
                    <MarkdownEditor
                      textAreaRef={textAreaRef}
                      comment={comment}
                      setComment={setComment}
                    />
                    <div className="w-100 border-blue-grey relative flex justify-between rounded-b-lg border border-l border-r border-t-0 px-2 py-1 shadow-md">
                      <span className="text-gray text-xs leading-4">
                        Bild hinzufügen
                      </span>
                      <span className="text-gray text-xs leading-4">
                        Markdown unterstützt
                      </span>
                    </div>
                    <Form method="post">
                      <textarea
                        className="hidden"
                        value={comment}
                        name="comment"
                        id="comment"
                      ></textarea>
                      <Button name="_action" value="PUBLISH" type="submit">
                        Veröffentlichen
                      </Button>
                    </Form>
                  </div>
                )}
              </ClientOnly>
            )}
          </TabsContent>
        </Tabs>
        <div></div>
        <div>
          {showMap && (
            <MapProvider>
              <Map
                initialViewState={{
                  // @ts-ignore
                  latitude: campaign.centerpoint.geometry.coordinates[1],
                  // @ts-ignore
                  longitude: campaign.centerpoint.geometry.coordinates[0],
                  zoom: 4,
                }}
                style={{
                  height: "60vh",
                  width: "40vw",
                  position: "fixed",
                  bottom: "10px",
                  // marginTop: "2rem",
                  right: "10px",
                }}
              >
                <Source
                  id="polygon"
                  type="geojson"
                  // data={{ type: "FeatureCollection", features: clusters }}
                  //@ts-ignore
                  data={campaign.feature[0] as any}
                >
                  <Layer {...layer} />
                </Source>
              </Map>
            </MapProvider>
          )}
        </div>
        {/* </Form> */}
      </div>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  if (caught.status === 502) {
    return (
      <div className="absolute bottom-0 z-10 w-full">
        <div className="flex animate-fade-in-up items-center justify-center bg-white py-10">
          <div className="text-red-500">
            Oh no, we could not find this Campaign ID. Are you sure it exists?
          </div>
        </div>
      </div>
    );
  }
  throw new Error(`Unsupported thrown response status code: ${caught.status}`);
}
