import { Input } from "~/components/ui/input";
import {
  Layer,
  LngLatBounds,
  LngLatLike,
  MapLayerMouseEvent,
  MapProvider,
  MapRef,
  MapboxEvent,
  Marker,
  Source,
} from "react-map-gl";
import { Map } from "~/components/map";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { BBox } from "geojson";
import PointLayer from "~/components/campaigns/overview/map/point-layer";
// import { Campaign, Exposure, Priority, Prisma } from "@prisma/client";
import { Campaign, exposureEnum, priorityEnum } from "~/schema";
import { Link } from "@remix-run/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import { CountryDropdown } from "../country-dropdown";
import PhenomenaSelect from "../../phenomena-select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { CalendarIcon } from "lucide-react";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { DataItem } from "~/components/ui/multi-select";

export default function CampaignMap({
  campaigns,
  phenomena,
}: {
  campaigns: Campaign[];
  // setDisplayedCampaigns: Dispatch<SetStateAction<Campaign[]>>;
  phenomena: string[];
}) {
  type PriorityType = keyof typeof priorityEnum;
  type ExposureType = keyof typeof exposureEnum;

  const mapRef = useRef<MapRef>(null);
  const [mapBounds, setMapBounds] = useState<BBox>();
  const [zoom, setZoom] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterObject, setFilterObject] = useState<{
    priority: PriorityType | "";
    country: string;
    exposure: ExposureType | "";
    phenomena: string[];
    time_range: DateRange | undefined;
  }>({
    priority: "",
    country: "",
    exposure: "",
    phenomena: [],
    time_range: {
      from: undefined,
      to: undefined,
    },
  });
  const [filteredCampaigns, setFilteredCampaigns] =
    useState<Campaign[]>(campaigns);

  const [selectedPhenomena, setSelectedPhenomena] = useState<DataItem[]>([]);

  const [visibleCampaigns, setVisibleCampaigns] = useState<Campaign[]>([]);

  const handleMapLoad = useCallback(() => {
    const map = mapRef?.current?.getMap();
    if (map) {
      setMapBounds(map.getBounds().toArray().flat() as BBox);
    }
  }, []);

  //show only campaigns in sidebar that are within map view
  const handleMapMouseMove = useCallback(
    (event: MapLayerMouseEvent) => {
      const map = mapRef?.current?.getMap();
      if (map) {
        const bounds = map.getBounds();
        const visibleCampaigns: Campaign[] = campaigns.filter(
          (campaign: Campaign) => {
            const centerObject = campaign.centerpoint as any;
            const geometryObject = centerObject.geometry as any;
            const coordinates = geometryObject.coordinates;
            if (coordinates && Array.isArray(coordinates))
              return bounds.contains([
                coordinates[0] as number,
                coordinates[1] as number,
              ]);
          }
        );
        console.log(filteredCampaigns);
        const visibleAndFiltered = filteredCampaigns.filter(
          (filtered_campaign) =>
            visibleCampaigns.some(
              (visible_campaign) => visible_campaign.id === filtered_campaign.id
            )
        );
        setVisibleCampaigns(visibleAndFiltered);
        // setFilteredCampaigns(visibleAndFiltered);
      }
    },
    [campaigns, filteredCampaigns]
  );

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  useEffect(() => {
    setFilteredCampaigns(
      campaigns.filter((campaign: Campaign) =>
        campaign.title.includes(searchTerm.toLocaleLowerCase())
      )
    );
  }, [campaigns, searchTerm]);

  useEffect(() => {
    setFilterObject({
      ...filterObject,
      phenomena: selectedPhenomena.map((p) => p.label),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhenomena]);

  const checkPriorityMatch = useCallback(
    (priority: string) => {
      return (
        !filterObject.priority ||
        priority.toLowerCase() === filterObject.priority.toLowerCase()
      );
    },
    [filterObject.priority]
  );

  const checkCountryMatch = useCallback(
    (countries: string[] | null) => {
      if (!countries || countries.length === 0) {
        return true;
      }
      return (
        !filterObject.country ||
        countries.some(
          (country) =>
            country.toLowerCase() === filterObject.country.toLowerCase()
        )
      );
    },
    [filterObject.country]
  );

  const checkExposureMatch = useCallback(
    (exposure: string) => {
      return (
        !filterObject.exposure ||
        exposure.toLowerCase() === filterObject.exposure.toLowerCase()
      );
    },
    [filterObject.exposure]
  );

  const checkTimeRangeMatches = useCallback(
    (startDate: Date | null, endDate: Date | null) => {
      if (
        !filterObject.time_range ||
        !filterObject.time_range.from ||
        !filterObject.time_range.to
      )
        return true;

      const dateRange = [
        filterObject.time_range.from,
        filterObject.time_range.to,
      ];

      function inRange(element: Date, index: number, array: any) {
        if (!startDate || !endDate) {
          return false;
        }
        const campaignStartTimestamp = new Date(startDate).getTime();
        const campaignEndTimestamp = new Date(endDate).getTime();
        const filterTimeStamp = new Date(element).getTime();

        return (
          filterTimeStamp >= campaignStartTimestamp &&
          filterTimeStamp <= campaignEndTimestamp
        );
      }

      return dateRange.some(inRange);
    },
    [filterObject.time_range]
  );

  const checkPhenomenaMatch = useCallback(
    (phenomena: string[]) => {
      const filterPhenomena: string[] = filterObject.phenomena;

      if (filterPhenomena.length === 0) {
        return true;
      }

      const hasMatchingPhenomena = phenomena.some((phenomenon) =>
        filterPhenomena.includes(phenomenon)
      );

      return hasMatchingPhenomena;
    },
    [filterObject.phenomena]
  );

  useEffect(() => {
    console.log(filterObject);
    const filteredCampaigns = campaigns.slice().filter((campaign: Campaign) => {
      const priorityMatches = checkPriorityMatch(campaign.priority ?? '');
      const countryMatches = checkCountryMatch(campaign.countries);
      const exposureMatches = checkExposureMatch(campaign.exposure ?? '');
      const timeRangeMatches = checkTimeRangeMatches(
        campaign.startDate,
        campaign.endDate
      );
      const phenomenaMatches = checkPhenomenaMatch(campaign.phenomena ?? []);
      return (
        priorityMatches &&
        countryMatches &&
        exposureMatches &&
        timeRangeMatches &&
        phenomenaMatches
      );
    });
    setFilteredCampaigns(filteredCampaigns);
  }, [
    campaigns,
    checkCountryMatch,
    checkExposureMatch,
    checkPriorityMatch,
    checkTimeRangeMatches,
    checkPhenomenaMatch,
    filterObject,
  ]);

  return (
    <>
      <div className="absolute bottom-0 left-0 top-0 max-h-full w-1/4 overflow-hidden bg-slate-100">
        <fieldset className="m-0 border-none bg-gray-200 p-3">
          <Input
            id="feature-filter"
            type="text"
            placeholder="Filter by name"
            value={searchTerm}
            onChange={handleInputChange}
          ></Input>
        </fieldset>
        <Button
          variant="outline"
          className="w-full"
          onClick={() =>
            setFilterObject({
              priority: "",
              country: "",
              exposure: "",
              phenomena: [],
              time_range: {
                from: undefined,
                to: undefined,
              },
            })
          }
        >
          Reset Filters
        </Button>
        <Accordion
          className="m-0 w-full border-t-2 border-black bg-gray-200"
          type="single"
          collapsible
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>More Filters</AccordionTrigger>
            <AccordionContent>
              <Accordion
                className="m-0 w-full border-t-2 border-black bg-gray-200"
                type="single"
                collapsible
              >
                <AccordionItem value="item-1">
                  <AccordionTrigger>Filter by Priority</AccordionTrigger>
                  <AccordionContent className="bg-slate-200 p-2">
                    <RadioGroup
                      onValueChange={(e: PriorityType) => {
                        setFilterObject({ ...filterObject, priority: e });
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="URGENT"
                          id="r1"
                          // checked={filterObject.priority === "URGENT"}
                        />
                        <Label htmlFor="r1">Urgent</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="HIGH" id="r2" />
                        <Label htmlFor="r2">High</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="MEDIUM" id="r3" />
                        <Label htmlFor="r3">Medium</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="LOW" id="r4" />
                        <Label htmlFor="r4">Low</Label>
                      </div>
                    </RadioGroup>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <CountryDropdown
                setCountry={(e) =>
                  setFilterObject({ ...filterObject, country: e })
                }
              />
              <Accordion
                className="m-0 w-full border-t-2 border-black bg-gray-200"
                type="single"
                collapsible
              >
                <AccordionItem value="item-1">
                  <AccordionTrigger>Filter by Exposure</AccordionTrigger>
                  <AccordionContent className="bg-slate-200 p-2">
                    <RadioGroup
                      onValueChange={(e: ExposureType) =>
                        setFilterObject({ ...filterObject, exposure: e })
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="UNKNOWN" id="r1" />
                        <Label htmlFor="r1">Unknown</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="INDOOR" id="r2" />
                        <Label htmlFor="r2">Indoor</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="OUTDOOR" id="r3" />
                        <Label htmlFor="r3">Outdoor</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="MOBILE" id="r4" />
                        <Label htmlFor="r4">Mobile</Label>
                      </div>
                    </RadioGroup>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <PhenomenaSelect
                phenomena={phenomena}
                setSelected={setSelectedPhenomena}
              />
              <div className="grid gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      className={cn(
                        "justify-start text-left font-normal",
                        !filterObject.time_range && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterObject.time_range?.from ? (
                        filterObject.time_range.to ? (
                          <>
                            {format(filterObject.time_range.from, "LLL dd, y")}{" "}
                            - {format(filterObject.time_range.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(filterObject.time_range.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    // className="w-auto min-w-full bg-[#444] p-2"
                    align="end"
                    side="top"
                    style={{
                      width: 500,
                      background: "#444",
                      color: "white",
                      padding: 10,
                      overflow: "auto",
                    }}
                  >
                    <Calendar
                      className="w-[500px]"
                      initialFocus
                      mode="range"
                      defaultMonth={filterObject.time_range?.from}
                      selected={filterObject.time_range}
                      onSelect={(e) => {
                        setFilterObject({
                          ...filterObject,
                          time_range: {
                            from: e?.from,
                            to: e?.to,
                          },
                        });
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div
          id="campaign-listing"
          className="m-0 block max-h-full overflow-auto pl-1 pr-2"
        >
          {visibleCampaigns.map((campaign: Campaign) => {
            return (
              <Link
                className="m-0 block border-b-2 py-2 pl-1 pr-2 last:border-none hover:text-blue-500"
                to={`../${campaign.slug}`}
                key={campaign.id}
              >
                {campaign.title}
              </Link>
            );
          })}
        </div>
      </div>
      <MapProvider>
        <Map
          initialViewState={{
            latitude: 51,
            longitude: 7,
            zoom: 1,
          }}
          // interactiveLayerIds={["clusters-count", "clusters"]}
          // preserveDrawingBuffer
          onMouseMove={handleMapMouseMove}
          // onClick={handleMapClick}
          onLoad={handleMapLoad}
          onZoom={(e) => setZoom(Math.floor(e.viewState.zoom))}
          ref={mapRef}
          style={{
            height: "100vh",
            width: "75%",
            left: "25%",
            // position: "absolute",
            // top: 0,
            bottom: 0,
            // margin: "auto",
          }}
        >
          <PointLayer campaigns={filteredCampaigns as any} />
        </Map>
      </MapProvider>
    </>
  );
}
