import { LoaderArgs, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { Switch } from "~/components/ui/switch";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { ChevronDown } from "lucide-react";
// import Header from "./header";
import { Map } from "~/components/Map";
import { getCampaigns, updateCampaign } from "~/models/campaign.server";
import Markers from "~/components/Map/Markers";
import { MarkerProps } from "react-map-gl";
import { Progress } from "~/components/ui/progress";
import { CountryFlagIcon } from "~/components/ui/CountryFlag";

export async function loader({ params }: LoaderArgs) {
  // request to API with deviceID
  const campaigns = await getCampaigns();
  // const data = await campaigns.json();
  // if (data.code === "UnprocessableEntity") {
  //   throw new Response("Campaigns not found", { status: 502 });
  // }
  return json(campaigns);
}

export default function Campaigns() {
  const data = useLoaderData<typeof loader>();
  const [showMap, setShowMap] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [urgency, setUrgency] = useState("");
  const [markers, setMarkers] = useState<MarkerProps[]>([]);

  // const [campaigns, setCampaigns] = useState<Campaign[]>([])

  const resetFilters = () => {
    setUrgency("");
    setSortBy("");
  };

  const filteredCampaigns = data.filter((campaign: any) => {
    const titleMatches = campaign.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const priorityMatches =
      !urgency || campaign.priority.toLowerCase() === urgency.toLowerCase();
    return titleMatches && priorityMatches;
  });

  const sortedCampaigns = filteredCampaigns.sort((a: any, b: any) => {
    const urgencyOrder = { urgent: 0, high: 1, medium: 2, low: 3 }; // Define urgency priority order
    return (
      urgencyOrder[a.priority.toLowerCase() as keyof typeof urgencyOrder] -
      urgencyOrder[b.priority.toLowerCase() as keyof typeof urgencyOrder]
    );
  });

  const centerpoints = data
    .map((campaign: any) => {
      if (
        campaign.centerpoint &&
        campaign.centerpoint.geometry &&
        campaign.centerpoint.geometry.coordinates
      ) {
        return campaign.centerpoint.geometry.coordinates;
      } else {
        return null;
      }
    })
    .filter((coords) => coords !== null);

  const markerArray: MarkerProps[] = centerpoints.map((coords, i) => ({
    key: i,
    longitude: coords[0],
    latitude: coords[1],
  }));

  useEffect(() => {
    setMarkers(markerArray);
  }, []);

  const displayedCampaigns =
    sortBy === "dringlichkeit" ? sortedCampaigns : filteredCampaigns;

  return (
    <div className="flex flex-col ">
      {/* <Header /> */}
      {/* <Link to={"./create"} className="ml-auto mt-2 mr-2">
        <Button size="lg" className="bg-green-300 text-lg ">
          Erstellen
        </Button>
      </Link> */}
      <input
        className="focus:ring-blue-400 mx-auto mt-20 w-1/3 rounded-md border border-gray-300 px-4 py-2 text-center text-lg focus:border-transparent focus:outline-none focus:ring-2"
        type="text"
        placeholder="Search campaigns"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />
      <div className="my-4 flex flex-row gap-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size={"lg"}>
              Dringlichkeit{" "}
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40">
            <DropdownMenuRadioGroup value={urgency} onValueChange={setUrgency}>
              <DropdownMenuRadioItem value="urgent">
                Urgent
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size={"lg"}>
              Sortieren nach{" "}
              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40">
            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
              <DropdownMenuRadioItem value="dringlichkeit">
                Dringlichkeit
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="erstellung">
                Erstellung
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant={"ghost"} size={"lg"} onClick={resetFilters}>
          Filter zurücksetzen
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
      {data.length === 0 ? (
        <div>
          Zurzeit gibt es noch keine Kampagnen. Klicke hier um eine Kampagne zu
          erstellen
        </div>
      ) : (
        <div className="flex flex-wrap">
          <div
            className={clsx("p-4", {
              "w-full": !showMap,
              "w-1/4 lg:w-3/4": showMap,
            })}
          >
            <div
              className={clsx("grid", {
                "grid-cols-3 gap-4": !showMap,
                "grid-cols-2 gap-3": showMap,
              })}
            >
              {displayedCampaigns.map((item: any) => (
                <Link key={item.id} to={`${item.id}`}>
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        <div className="flex flex-wrap">
                          <span className="flex flex-wrap">
                            {item.title}
                            <CountryFlagIcon country={String(item.country)} />
                          </span>
                          <div className="ml-auto">
                            <span
                              className={clsx(
                                "mr-2 w-fit rounded px-2 py-1 text-white",
                                {
                                  "bg-red-500":
                                    item.priority.toLowerCase() === "urgent",
                                  "bg-yellow-500":
                                    item.priority.toLowerCase() === "high",
                                  "bg-blue-500":
                                    item.priority.toLowerCase() === "medium",
                                  "bg-green-500":
                                    item.priority.toLowerCase() === "low",
                                }
                              )}
                            >
                              {item.priority}
                            </span>
                            {item.exposure !== "UNKNOWN" && (
                              <span
                                className={clsx(
                                  "w-fit rounded px-2 py-1 text-white",
                                  {
                                    "bg-blue-200":
                                      item.exposure.toLowerCase() === "indoor",
                                    "bg-orange-500":
                                      item.exposure.toLowerCase() === "mobile",
                                    "bg-emerald-500":
                                      item.exposure.toLowerCase() === "outdoor",
                                  }
                                )}
                              >
                                {item.exposure}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardTitle>
                      <CardDescription>{item.keywords || ""}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Progress
                        max={item.requiredParticipants}
                        value={item.participantCount}
                        // onMouseEnter={}
                      />
                    </CardContent>
                    <CardFooter>
                      <Accordion className="w-full" type="single" collapsible>
                        <AccordionItem value="item-1">
                          <AccordionTrigger className="text-blue-600 hover:text-blue-800">
                            Learn More
                          </AccordionTrigger>
                          <AccordionContent>
                            {item.description}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
          {showMap && (
            <div className="flex-1 md:w-full lg:w-1/3">
              <Map
                style={{
                  height: "80vh",
                  width: "100%",
                  position: "relative",
                  marginTop: "2rem",
                }}
              >
                <Markers markers={markers} />
                {/* {centerpoints.map((point, i) => {
                    return (
                      <Marker
                        key={i}
                        longitude={point[0]}
                        latitude={point[1]}
                      ></Marker>
                    );
                  })} */}
              </Map>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
