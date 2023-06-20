import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useCatch, useLoaderData } from "@remix-run/react";
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
import { useToast } from "~/components/ui/use-toast";
import { useEffect } from "react";
import { Map } from "~/components/Map";
import { LayerProps, MapProvider, Source, Layer } from "react-map-gl";
import { campaignSchema } from "~/lib/validations/campaign";
import { Feature } from "geojson";
import { ClockIcon } from "lucide-react";
import clsx from "clsx";

export async function action({ request }: ActionArgs) {
  // const ownerId = await requireUserId(request);
  const formData = await request.formData();
  console.log(formData);
  const email = formData.get("email");
  const hardware = formData.get("hardware");
  return null;
}

export async function loader({ params }: LoaderArgs) {
  // request to API with deviceID

  const campaign = await getCampaign({ id: params.campaignId ?? "" });
  if (!campaign) {
    throw new Response("Campaign not found", { status: 502 });
  }
  return json(campaign);
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
  const { toast } = useToast();
  const participate = () => {};
  // useEffect(() => {
  //   toast({
  //     title: "HELLO",
  //   });
  // }, []);

  return (
    <div className="h-full w-full">
      <div className="grid grid-cols-2">
        <div>
          <span
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
          </h1>
          <h2 className=" ml-4 mb-4 font-bold">
            <b>Beschreibung</b>
          </h2>
          <p className="ml-4 mb-4">{data.description}</p>
          {/* <Form> */}
          <Dialog>
            <DialogTrigger asChild>
              <Button disabled className="float-right mr-4">
                Teilnehmen
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
        </div>
        <div>
          <MapProvider>
            <Map
              initialViewState={{
                //@ts-ignore
                latitude: data.centerpoint.geometry.coordinates[1],
                //@ts-ignore
                longitude: data.centerpoint.geometry.coordinates[0],
                zoom: 8,
              }}
              style={{
                height: "70vh",
                width: "60vw",
                position: "fixed",
                // marginTop: "2rem",
              }}
            >
              <Source
                id="polygon"
                type="geojson"
                // data={{ type: "FeatureCollection", features: clusters }}
                //@ts-ignore
                data={data.feature[0] as any}
              >
                <Layer {...layer} />
              </Source>
            </Map>
          </MapProvider>
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
