import type {
  ActionArgs,
  LinksFunction,
  LoaderArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useCatch, useLoaderData, useActionData } from "@remix-run/react";
import { getCampaign } from "~/models/campaign.server";
import { getUserId } from "~/session.server";
import { useToast } from "~/components/ui/use-toast";
import { useEffect, useState } from "react";
import { Map } from "~/components/map";
import type { LayerProps } from "react-map-gl";
import { MapProvider, Source, Layer } from "react-map-gl";
// import { updateCampaign } from "~/models/campaign.server";
import maplibregl from "maplibre-gl/dist/maplibre-gl.css";
import {
  publishCommentAction,
  publishPostAction,
  createCampaignEvent,
  deleteCampaignEvent,
  deleteCommentAction,
  updateCampaignEvent,
  deleteCampaignAction,
  updateCommentAction,
  messageAllUsers,
  participate,
  bookmark,
  updateCampaignAction,
  // getCommentsAction,
} from "~/lib/actions";
import tributeStyles from "tributejs/tribute.css";
import { getPhenomena } from "~/models/phenomena.server";
import { useTranslation } from "react-i18next";
import type { Campaign } from "~/schema";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";
import CampaignTable from "~/components/campaigns/campaignId/table";
import CreateThread from "~/components/campaigns/campaignId/posts/create";
import ListPosts from "~/components/campaigns/campaignId/posts";
import CampaignIdHeader from "~/components/campaigns/campaignId/header";

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
    // case "GET_COMMENTS":
    //   return getCommentsAction(args);
    case "CREATE_POST":
      return publishPostAction(args);
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
    case "UPDATE_CAMPAIGN":
      return updateCampaignAction(args);
    case "DELETE_CAMPAIGN":
      return deleteCampaignAction(args);
    case "BOOKMARK":
      return bookmark(args);
    case "MESSAGE_ALL":
      return messageAllUsers(args);

    default:
      throw new Error(`Unknown action: ${_action}`);
  }
}

export const meta: MetaFunction<typeof loader> = ({ params }) => ({
  charset: "utf-8",
  title: "openSenseMap",
  description: `Trage zu dieser Kampagne bei: ${params.slug}`,
  viewport: "width=device-width,initial-scale=1",
  "og:title": "openSenseMap",
  "og:description": `Trage zu dieser Kampagne bei: ${params.slug}`,
  // "og:image": "URL_TO_IMAGE",
  "og:url": `https://magellan.testing.opensensemap.org/`,
  "og:type": "website",
});

export async function loader({ request, params }: LoaderArgs) {
  // const userId = await requireUserId(request);
  const userId = await getUserId(request);

  const slug = params.slug ?? "";

  const campaign = await getCampaign({ slug }, userId ?? "");
  if (!campaign) {
    throw new Response("Campaign not found", { status: 502 });
  }
  // const isBookmarked = !!campaign?.bookmarkedByUsers.length;
  const response = await getPhenomena();
  if (response.code === "UnprocessableEntity") {
    throw new Response("Phenomena not found", { status: 502 });
  }
  const phenomena = response.map((p: { slug: string }) => p.slug);
  return json({ campaign, userId, phenomena });
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
  const actionData = useActionData();
  const { t } = useTranslation("campaign-slug");
  const campaign = data.campaign;
  const userId = data.userId;
  // const bookmarked = data.isBookmarked;
  const [messageForParticipants, setMessageForParticipants] = useState<
    string | undefined
  >("");

  const [showMap, setShowMap] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (actionData) {
      if (actionData.bookmarked) {
        toast({
          description: <span>{t("campaign successfully bookmarked")}</span>,
        });
      }
      if (actionData.unbookmarked) {
        toast({
          description: <span>{t("campaign successfully un-bookmarked")}</span>,
        });
      }
    }
  }, [actionData, t, toast]);

  return (
    <div className="h-full w-full">
      <CampaignIdHeader
        campaign={campaign as any}
        showMap={showMap}
        setShowMap={setShowMap}
      />

      <h1 className="m-6 font-bold">Contributors</h1>
      <div className="flex">
        {campaign.participants.map((p) => {
          return <span>{p.user.name}</span>;
        })}
      </div>

      <div className="flex w-full justify-center">
        <CampaignTable
          owner={userId === campaign.ownerId}
          campaign={campaign as unknown as Campaign}
          phenomena={data.phenomena}
        />

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
                  height: "35vh",
                  width: "25vw",
                  position: "sticky",
                  top: 0,
                  marginLeft: "auto",
                }}
              >
                {campaign.feature && (
                  <Source
                    id="polygon"
                    type="geojson"
                    data={
                      campaign.feature as unknown as FeatureCollection<
                        Geometry,
                        GeoJsonProperties
                      >
                    }
                  >
                    <Layer {...layer} />
                  </Source>
                )}
              </Map>
            </MapProvider>
          )}
        </div>
        {/* </Form> */}
      </div>
      <ListPosts posts={campaign.posts as any} />

      <CreateThread
        loggedIn={userId != undefined}
        participants={campaign.participants}
      />
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
