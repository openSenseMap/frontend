import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useCatch, useLoaderData } from "@remix-run/react";
import { getCampaign } from "~/models/campaign.server";

export async function loader({ params }: LoaderArgs) {
  // request to API with deviceID

  const campaign = await getCampaign({ id: params.campaignId ?? "" });
  if (!campaign) {
    throw new Response("Campaign not found", { status: 502 });
  }
  return json(campaign);
}

export default function CampaignId() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      <h2>
        <b>{data.title}</b>
      </h2>
      <h3>
        <b>Beschreibung</b>
      </h3>
      <p>{data.description}</p>
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
