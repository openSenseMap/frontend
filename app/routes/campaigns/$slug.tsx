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
import { requireUserId } from "~/session.server";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "~/components/ui/use-toast";
import { useEffect, useRef, useState } from "react";
import { Map } from "~/components/Map";
import type { LayerProps } from "react-map-gl";
import { MapProvider, Source, Layer } from "react-map-gl";
import { ClockIcon, UsersIcon, Share2Icon, DownloadIcon } from "lucide-react";
import clsx from "clsx";
import ShareLink from "~/components/bottom-bar/share-link";
import { updateCampaign } from "~/models/campaign.server";
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
  participate,
} from "~/lib/actions";
import OverviewTable from "~/components/campaigns/campaignId/overview-tab/overview-table";
import EventForm from "~/components/campaigns/campaignId/event-tab/create-form";
import EventCards from "~/components/campaigns/campaignId/event-tab/event-cards";
import CommentInput from "~/components/campaigns/campaignId/comment-tab/comment-input";
import CommentCards from "~/components/campaigns/campaignId/comment-tab/comment-cards";
import Tribute from "tributejs";
import tributeStyles from "tributejs/tribute.css";

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: maplibregl,
    },
    {
      rel: "stylesheet",
      href: tributeStyles,
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
    case "PARTICIPATE":
      return participate(args);
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
  const participants = campaign.participants.map(function (participant) {
    return { key: participant.name, value: participant.name };
  });
  const userId = data.userId;
  const [commentEditMode, setCommentEditMode] = useState(false);
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
  const isBundle = useRef(false);
  const eventTextAreaRef = useRef();
  const { toast } = useToast();

  const tribute = new Tribute({
    trigger: "@",
    values: participants,
    itemClass: "bg-blue-700 text-black",
  });

  useEffect(() => {
    if (
      textAreaRef.current &&
      !isBundle.current &&
      Array.isArray(participants)
    ) {
      isBundle.current = true;
      //@ts-ignore
      tribute.attach(textAreaRef.current.textarea);
      //@ts-ignore
      textAreaRef.current.textarea.addEventListener("tribute-replaced", (e) => {
        setComment(e.target.value);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textAreaRef.current]);

  return (
    <div className="h-full w-full">
      <hr className="my-2 w-full bg-gray-700" />
      <div className="flex w-full justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-bold capitalize">
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
        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex w-fit gap-2 " variant="outline">
                Teilnehmen <UsersIcon className="h-4 w-4" />{" "}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Teilnehmen</DialogTitle>
                <DialogDescription>
                  <p className="font-bold">
                    Indem Sie auf Teilnehmen klicken stimmen Sie zu, dass Sie
                    der Kampagnenleiter unter der von Ihnen angegebenen Email-
                    Adresse kontaktieren darf!
                  </p>
                  <p className="mt-2">
                    Bitte gib ausserdem an, ob du bereits über die benötigte
                    Hardware verfügst.
                  </p>
                </DialogDescription>
              </DialogHeader>
              <Form method="post">
                <input
                  className="hidden"
                  value={campaign.id}
                  name="campaignId"
                  id="campaignId"
                />
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
                  <Button name="_action" value="PARTICIPATE" type="submit">
                    Teilnehmen
                  </Button>
                </DialogFooter>
              </Form>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex w-fit gap-2 " variant="outline">
                Teilen <Share2Icon className="h-4 w-4" />{" "}
              </Button>
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
            className="flex w-fit gap-2 "
            // @ts-ignore
            onClick={() => downloadGeojSON(campaign.feature)}
          >
            GeoJSON herunterladen
            <DownloadIcon className="h-4 w-4" />
          </Button>
          <div className="flex flex-col items-center justify-center">
            <span>Karte anzeigen</span>
            <Switch
              id="showMapSwitch"
              checked={showMap}
              onCheckedChange={() => setShowMap(!showMap)}
            />
          </div>
        </div>
      </div>
      <hr className="my-2 w-full bg-gray-700" />

      <div className={`${showMap ? "grid grid-cols-2" : "w-full"}`}>
        <Tabs defaultValue={tabView} className="w-full">
          <div className="flex items-center justify-center">
            <TabsList className="w-full justify-between p-2">
              <TabsTrigger value="overview">
                <Button variant="outline">Übersicht</Button>
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <Button variant="outline">Kalender</Button>
              </TabsTrigger>
              <TabsTrigger value="comments">
                <Button variant="outline">Fragen und Kommentare</Button>
              </TabsTrigger>
            </TabsList>
          </div>
          {/* <div className="h-screen w-full rounded border border-gray-100"> */}
          <TabsContent value="overview">
            <OverviewTable campaign={campaign as any} />
          </TabsContent>
          <TabsContent value="calendar">
            {campaign.events.length === 0 ? (
              <EventForm
                eventDescription={eventDescription || ""}
                setEventDescription={setEventDescription}
                eventTextAreaRef={eventTextAreaRef}
              />
            ) : (
              <EventCards
                events={campaign.events}
                editEventDescription={editEventDescription || ""}
                editEventTitle={editEventTitle || ""}
                eventEditMode={eventEditMode}
                eventTextAreaRef={eventTextAreaRef}
                setEditEventDescription={setEditEventDescription}
                setEditEventStartDate={setEditEventStartDate}
                setEditEventTitle={setEditEventTitle}
                setEventEditMode={setEventEditMode}
                userId={userId}
              />
            )}
          </TabsContent>
          <TabsContent value="comments">
            <CommentCards
              commentEditMode={commentEditMode}
              comments={campaign.comments}
              editComment={editComment || ""}
              setCommentEditMode={setCommentEditMode}
              setEditComment={setEditComment}
              setEditCommentId={setEditCommentId}
              textAreaRef={textAreaRef}
              userId={userId}
            />
            {!editComment && (
              <CommentInput
                comment={comment}
                setCommentEditMode={setCommentEditMode}
                setComment={setComment}
                textAreaRef={textAreaRef}
              />
            )}
          </TabsContent>
          {/* </div> */}
        </Tabs>
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
                  position: "sticky",
                  top: 0,
                  marginLeft: "auto",
                }}
              >
                <Source
                  id="polygon"
                  type="geojson"
                  // data={{ type: "FeatureCollection", features: clusters }}
                  //@ts-ignore
                  data={campaign.feature as any}
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
