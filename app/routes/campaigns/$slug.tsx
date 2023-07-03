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
import { createComment, deleteComment } from "~/models/comment.server";
import maplibregl from "maplibre-gl/dist/maplibre-gl.css";
import { Switch } from "~/components/ui/switch";
import { downloadGeojSON } from "~/lib/download-geojson";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Markdown from "markdown-to-jsx";

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
  if (_action === "PUBLISH") {
    return publishAction(args);
  }
  if (_action === "DELETE") {
    return deleteCommentAction(args);
  }
  // if (_action === "UPDATE") {
  //   return updateAction(args);
  // }
  throw new Error("Unknown action");
}

async function publishAction({ request, params }: ActionArgs) {
  const ownerId = await requireUserId(request);
  const formData = await request.formData();
  const content = formData.get("comment");
  if (typeof content !== "string" || content.length === 0) {
    return json(
      { errors: { content: "content is required", body: null } },
      { status: 400 }
    );
  }
  const campaignSlug = params.slug;
  if (typeof campaignSlug !== "string" || campaignSlug.length === 0) {
    return json(
      { errors: { campaignSlug: "campaignSlug is required", body: null } },
      { status: 400 }
    );
  }
  try {
    const comment = await createComment({ content, campaignSlug, ownerId });
    return json({ ok: true });
  } catch (error) {
    console.error(`form not submitted ${error}`);
    return json({ error });
  }
}

async function deleteCommentAction({ request }: ActionArgs) {
  const formData = await request.formData();
  const commentId = formData.get("deleteComment");
  if (typeof commentId !== "string" || commentId.length === 0) {
    return json(
      { errors: { commentId: "commentId is required", body: null } },
      { status: 400 }
    );
  }
  try {
    const commentToDelete = await deleteComment({ id: commentId });
    return json({ ok: true });
  } catch (error) {
    console.error(`form not submitted ${error}`);
    return json({ error });
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
  const [comment, setComment] = useState<string | undefined>("");
  const [showMap, setShowMap] = useState(true);
  const [tabView, setTabView] = useState<"overview" | "calendar" | "comments">(
    "overview"
  );
  const textAreaRef = useRef();
  const { toast } = useToast();
  const participate = () => {};
  // useEffect(() => {
  //   toast({
  //     title: "HELLO",
  //   });
  // }, []);

  return (
    <div className="h-full w-full">
      <div className="float-right flex gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Teilnehmen</Button>
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
            <Button>Teilen</Button>
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
        {/* @ts-ignore */}
        <Button onClick={() => downloadGeojSON(data.feature[0])}>
          GeoJSON herunterladen
        </Button>
        <span>Karte anzeigen</span>
        <Switch
          id="showMapSwitch"
          checked={showMap}
          onCheckedChange={() => setShowMap(!showMap)}
        />
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
              <Button>Übersicht</Button>
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Button>Kalender</Button>
            </TabsTrigger>
            <TabsTrigger value="comments">
              <Button>Fragen und Kommentare</Button>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <h2 className=" ml-4 mb-4 font-bold">Beschreibung</h2>
            <p className="ml-4 mb-4">{campaign.description}</p>
          </TabsContent>
          <TabsContent value="calendar"></TabsContent>
          <TabsContent value="comments">
            <h2 className=" ml-4 mb-4 font-bold">Fragen und Kommentare</h2>
            {campaign.comments.map((c, i) => {
              return (
                <div key={i}>
                  {userId === campaign.ownerId && (
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
                  )}
                  <Markdown>{c.content}</Markdown>;
                </div>
              );
            })}
            {/* <Form> */}
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
          </TabsContent>
        </Tabs>
        <div>
          {/* <span
            className={clsx(
              " float-right mr-4 flex w-fit rounded px-2 py-1 text-sm text-white",
              {
                "bg-red-500": data.priority.toLowerCase() === "urgent",
                "bg-yellow-500": data.priority.toLowerCase() === "high",
                "bg-blue-500": data.priority.toLowerCase() === "medium",
                "bg-green-500": data.priority.toLowerCase() === "low",
              }
            )}
          >
            <ClockIcon className="h-4 w-4" /> {data.priority}
          </span>
          <h1 className="mt-6 mb-2 text-lg font-bold capitalize">
            <b>{data.title}</b>
          </h1> */}
          {/* <h2 className=" ml-4 mb-4 font-bold">Fragen und Kommentare</h2>
          <p>{data.comments.map((c) => c.content)}</p>
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
          </ClientOnly> */}
        </div>
        <div>
          {showMap && (
            <MapProvider>
              <Map
                initialViewState={{
                  //@ts-ignore
                  latitude: campaign.centerpoint.geometry.coordinates[1],
                  //@ts-ignore
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
