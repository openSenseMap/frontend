import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useCatch, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { getCampaign } from "~/models/campaign.server";
import { getUserId } from "~/session.server";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const participate = () => {};
  return (
    <div className="h-full w-full">
      <h2 className="ml-2 mb-2 text-lg font-bold">
        <b>{data.title}</b>
      </h2>
      <h3 className="text-sm font-bold">
        <b>Beschreibung</b>
      </h3>
      <p className="text-sm">{data.description}</p>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Teilnehmen</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Teilnehmen</DialogTitle>
            <DialogDescription>
              Bitte gib eine Email Adresse an unter der dich der Kampagnenleiter
              kontaktieren darf. Bitte gib ausserdem an, ob du bereits über die
              benötigte Hardware verfügst.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-row flex-wrap justify-between">
              <label htmlFor="email" className="text-right">
                Email
              </label>
              <input
                id="email"
                className="autofocus w-2/3 border border-gray-400"
              />
            </div>
            <div className="flex">
              <label htmlFor="hardware" className="text-right">
                Hardware vorhanden
              </label>
              <input id="hardware" type="checkbox" className="ml-auto" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Teilnehmen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
