import { LoaderArgs, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import { useState } from "react";
import { Switch } from "~/components/ui/switch";
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
import Header from "./header";
import { Map } from "~/components/Map";

export async function loader({ params }: LoaderArgs) {
  console.log(process.env.OSEM_API_URL);
  // request to API with deviceID
  const response = await fetch(process.env.OSEM_API_URL + "/users/campaigns/");
  const data = await response.json();
  if (data.code === "UnprocessableEntity") {
    throw new Response("Campaigns not found", { status: 502 });
  }
  return json(data);
}

export default function Campaigns() {
  const data = useLoaderData<typeof loader>();
  const [showMap, setShowMap] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [urgency, setUrgency] = useState("");

  const resetFilters = () => {
    setUrgency("");
    setSortBy("");
  };

  const filteredCampaigns = data.data.stream.filter((campaign: any) => {
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

  const displayedCampaigns =
    sortBy === "dringlichkeit" ? sortedCampaigns : filteredCampaigns;

  return (
    <div className="flex flex-col overflow-y-scroll">
      <Header />
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
      <div className="my-4 flex flex-row gap-2">
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
      {data.data.stream.length === 0 ? (
        <div>
          Zurzeit gibt es noch keine Kampagnen. Klicke hier um eine Kampagne zu
          erstellen
        </div>
      ) : (
        // <div
        //   className={clsx(
        //     "grid",
        //     { "grid-cols-2": showMap, "grid-cols-3": !showMap },
        //     "gap-4"
        //   )}
        // >
        <div className="flex flex-wrap">
          <div
            className={clsx("p-4", {
              "w-full": !showMap,
              "md:w-2/3 lg:w-3/4": showMap,
            })}
          >
            <div className="grid grid-cols-3 gap-4">
              {displayedCampaigns.map((item: any) => (
                <Accordion
                  key={item.id}
                  className="relative mx-2 mb-4 mt-2 rounded-lg bg-white p-4 shadow-md"
                  type="single"
                  collapsible
                >
                  <AccordionItem value="item-1">
                    <div className="absolute top-0 right-0 m-2 flex justify-end">
                      <div
                        className={clsx(
                          "rounded-md px-2 py-1 text-xs font-medium text-white",
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
                      </div>
                    </div>
                    <h2 className="mb-2 text-lg font-medium">{item.title}</h2>
                    <p className="text-gray-600">{item.description}</p>
                    <AccordionTrigger className="text-blue-600 hover:text-blue-800">
                      Learn More
                    </AccordionTrigger>
                    <AccordionContent>{item.description}</AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </div>
          </div>
          {showMap && (
            <div className="w-full p-4 md:w-1/3 lg:w-1/4">
              <Map
                style={{
                  width: "100%",
                  height: "50%",
                  position: "relative",
                  marginTop: "2rem",
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
