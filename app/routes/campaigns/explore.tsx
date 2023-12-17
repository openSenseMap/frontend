import { ActionArgs, LinksFunction, LoaderArgs, json } from "@remix-run/node";
import {
  Form,
  Link,
  useLoaderData,
  useSearchParams,
  useActionData,
} from "@remix-run/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Map } from "~/components/Map";
import {
  getBookmarks,
  getCampaignCount,
  getCampaigns,
} from "~/models/campaign.server";
import {
  Layer,
  LngLatBounds,
  MapLayerMouseEvent,
  MapProvider,
  MapRef,
  MapboxEvent,
  Marker,
  Source,
} from "react-map-gl";
import type { BBox } from "geojson";
import maplibregl from "maplibre-gl/dist/maplibre-gl.css";
import { XMarkIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import PointLayer from "~/components/campaigns/overview/map/point-layer";
import { getPhenomena } from "~/models/phenomena.server";
// import FiltersBar from "~/components/campaigns/overview/filters-bar";
import type { Campaign, CampaignBookmark, Prisma } from "@prisma/client";
import Pagination from "~/components/campaigns/overview/pagination";
import { Button } from "~/components/ui/button";
import Filter from "~/components/campaigns/overview/campaign-filter";
import { getUserId, requireUserId } from "~/session.server";
import { bookmark } from "~/lib/actions";
import { generateWhereObject } from "~/components/campaigns/overview/where-query";
import { useToast } from "~/components/ui/use-toast";
import CampaignGrid from "~/components/campaigns/overview/grid";
import { triggerNotificationNewParticipant } from "~/novu.server";
import { Input } from "~/components/ui/input";
import CampaignMap from "~/components/campaigns/overview/map";

const PER_PAGE = 9;

export async function action(args: ActionArgs) {
  return bookmark(args);
}

export async function loader({ params, request }: LoaderArgs) {
  const userId = await getUserId(request);
  let bookmarks: CampaignBookmark[] = [];
  if (userId) {
    bookmarks = await getBookmarks({ userId });
  }
  const allCampaigns = await getCampaigns({});
  const url = new URL(request.url);
  const query = url.searchParams;
  const currentPage = Math.max(Number(query.get("page") || 1), 1);
  const options: {
    take: number;
    skip: number;
    orderBy: [{}, {}];
    where?: {};
  } = {
    take: PER_PAGE,
    skip: (currentPage - 1) * PER_PAGE,
    orderBy: [
      {
        bookmarks: {
          _count: "desc",
        },
      },
      {
        updatedAt: "desc",
      },
    ],
    where: generateWhereObject(query),
  };

  const countOptions = options.where;
  let sort = "";

  if (query.get("sortBy")) {
    const sortBy = query.get("sortBy") || "updatedAt";
    if (sortBy === "priority") {
      sort = "priority";
    }
    options.orderBy.push({
      [sortBy]: "desc",
    });
  }

  const campaignsOnPage = await getCampaigns(options, userId, sort);
  const campaignCount = await getCampaignCount();
  const phenos = await getPhenomena();
  if (phenos.code === "UnprocessableEntity") {
    throw new Response("Phenomena not found", { status: 502 });
  }
  const phenomena = phenos.map((p: { slug: string }) => p.slug);
  // const data = await campaigns.json();
  // if (data.code === "UnprocessableEntity") {
  //   throw new Response("Campaigns not found", { status: 502 });
  // }
  return json({
    allCampaigns,
    bookmarks,
    campaignsOnPage,
    campaignCount,
    phenomena,
    userId,
  });
}
export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: maplibregl,
    },
  ];
};

export default function Campaigns() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData();
  const { toast } = useToast();
  const { t } = useTranslation("explore-campaigns");
  const allCampaigns = data.allCampaigns as unknown as Campaign[];
  const bookmarks = data.bookmarks;
  const campaigns = data.campaignsOnPage;
  const phenomena = data.phenomena;
  const campaignCount = data.campaignCount;
  const userId = data.userId;
  const totalPages = Math.ceil(campaignCount / PER_PAGE);
  // const [mapLoaded, setMapLoaded] = useState(false);
  // const [markers, setMarkers] = useState<Array<PointFeature<PointProperties>>>(
  //   []
  // );

  const [searchParams] = useSearchParams();
  const mapShown = searchParams.get("showMap");

  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [phenomenaDropdown, setPhenomenaDropdownOpen] = useState(false);
  const [exposure, setExposure] = useState("");
  const [showMap, setShowMap] = useState(mapShown === "true" ? true : false);
  // const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [priority, setpriority] = useState("");
  // const [displayedCampaigns, setDisplayedCampaigns] = useState<Campaign[]>([]);
  const mapRef = useRef<MapRef>(null);
  const [mapBounds, setMapBounds] = useState<BBox>();
  const [zoom, setZoom] = useState(1);
  const [filterObject, setFilterObject] = useState({
    searchTerm: "",
    priority: "",
    country: "",
    exposure: "",
    phenomena: [] as string[],
    time_range: {
      startDate: "",
      endDate: "",
    },
  });

  useEffect(() => {
    // Access the map instance when the component mounts
    const map = mapRef?.current?.getMap();
    if (map) {
      const bounds = map.getBounds().toArray().flat();
      setMapBounds(bounds as BBox);
    }
  }, [mapRef]);

  // useEffect(() => {
  //   if (selectedCampaign) {
  //     setShowMap(true);
  //   }
  // }, [selectedCampaign]);

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

  // const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const resetFilters = () => {
    setFilterObject({
      searchTerm: "",
      priority: "",
      country: "",
      exposure: "",
      phenomena: [],
      time_range: {
        startDate: "",
        endDate: "",
      },
    });
    // const allCampaigns = campaigns.map((campaign: Campaign) => {
    //   return campaign;
    // });
    // setDisplayedCampaigns(allCampaigns);
    // setSelectedCampaign("");
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [0, 0],
        duration: 1000,
        zoom: 1,
      });
    }
  };

  // CLIENT-SIDE FILTERING IS REPLACED BY SERVER-SIDE FILTER FOR NOW

  // const checkTitleMatch = useCallback(
  //   (title: string) => {
  //     return title
  //       .toLowerCase()
  //       .includes(filterObject.searchTerm.toLowerCase());
  //   },
  //   [filterObject.searchTerm]
  // );

  // const checkPriorityMatch = useCallback(
  //   (priority: string) => {
  //     return (
  //       !filterObject.priority ||
  //       priority.toLowerCase() === filterObject.priority.toLowerCase()
  //     );
  //   },
  //   [filterObject.priority]
  // );

  // const checkCountryMatch = useCallback(
  //   (country: string | null) => {
  //     if (!country) {
  //       return true;
  //     }
  //     return (
  //       !filterObject.country ||
  //       country.toLowerCase() === filterObject.country.toLowerCase()
  //     );
  //   },
  //   [filterObject.country]
  // );

  // const checkExposureMatch = useCallback(
  //   (exposure: string) => {
  //     return (
  //       !filterObject.exposure ||
  //       exposure.toLowerCase() === filterObject.exposure.toLowerCase()
  //     );
  //   },
  //   [filterObject.exposure]
  // );

  // const checkTimeRangeMatches = useCallback(
  //   (startDate: Date | null, endDate: Date | null) => {
  //     const filterStartDate = filterObject.time_range.startDate;
  //     const filterEndDate = filterObject.time_range.endDate;

  //     if (!filterStartDate || !filterEndDate) {
  //       return true;
  //     }

  //     if (!startDate) {
  //       return false;
  //     }

  //     if (!endDate) {
  //       return false;
  //     }

  //     const campaignStartTimestamp = new Date(startDate).getTime();
  //     const campaignEndTimestamp = new Date(endDate).getTime();
  //     const filterStartTimestamp = new Date(filterStartDate).getTime();
  //     const filterEndTimestamp = new Date(filterEndDate).getTime();

  //     const isStartDateWithinRange =
  //       campaignStartTimestamp >= filterStartTimestamp &&
  //       campaignStartTimestamp <= filterEndTimestamp;

  //     const isEndDateWithinRange =
  //       campaignEndTimestamp >= filterStartTimestamp &&
  //       campaignEndTimestamp <= filterEndTimestamp;

  //     return isStartDateWithinRange && isEndDateWithinRange;
  //   },
  //   [filterObject.time_range]
  // );

  // const checkPhenomenaMatch = useCallback(
  //   (phenomena: string[]) => {
  //     const filterPhenomena: string[] = filterObject.phenomena;

  //     if (filterPhenomena.length === 0) {
  //       return true;
  //     }

  //     const hasMatchingPhenomena = phenomena.some((phenomenon) =>
  //       filterPhenomena.includes(phenomenon)
  //     );

  //     return hasMatchingPhenomena;
  //   },
  //   [filterObject.phenomena]
  // );

  // useEffect(() => {
  //   console.log(filterObject);
  //   const filteredCampaigns = campaigns.slice().filter((campaign: Campaign) => {
  //     const titleMatches = checkTitleMatch(campaign.title);
  //     const priorityMatches = checkPriorityMatch(campaign.priority);
  //     const countryMatches = checkCountryMatch(campaign.country);
  //     const exposureMatches = checkExposureMatch(campaign.exposure);
  //     const timeRangeMatches = checkTimeRangeMatches(
  //       campaign.startDate,
  //       campaign.endDate
  //     );
  //     // const phenomenaMatches = checkPhenomenaMatch(campaign.phenomena);
  //     return (
  //       titleMatches &&
  //       priorityMatches &&
  //       countryMatches &&
  //       exposureMatches &&
  //       timeRangeMatches
  //       // phenomenaMatches
  //     );
  //   });
  //   setDisplayedCampaigns(filteredCampaigns);
  // }, [
  //   campaigns,
  //   checkCountryMatch,
  //   checkExposureMatch,
  //   checkPriorityMatch,
  //   checkTitleMatch,
  //   checkTimeRangeMatches,
  //   // checkPhenomenaMatch,
  //   filterObject,
  // ]);

  // useEffect(() => {
  //   let sortedCampaigns;

  //   switch (sortBy) {
  //     case "erstelldatum":
  //       sortedCampaigns = campaigns
  //         .slice()
  //         .sort((campaignA: Campaign, campaignB: Campaign) => {
  //           const createdAtA = new Date(campaignA.createdAt).getTime();
  //           const createdAtB = new Date(campaignB.createdAt).getTime();
  //           return createdAtA - createdAtB;
  //         });
  //       break;

  //     case "dringlichkeit":
  //       const priorityOrder = {
  //         URGENT: 0,
  //         HIGH: 1,
  //         MEDIUM: 2,
  //         LOW: 3,
  //       };

  //       sortedCampaigns = campaigns
  //         .slice()
  //         .sort((campaignA: Campaign, campaignB: Campaign) => {
  //           const priorityA =
  //             priorityOrder[campaignA.priority as keyof typeof priorityOrder];
  //           const priorityB =
  //             priorityOrder[campaignB.priority as keyof typeof priorityOrder];

  //           return priorityA - priorityB;
  //         });
  //       break;

  //     default:
  //       sortedCampaigns = campaigns.slice();
  //   }

  //   setDisplayedCampaigns(sortedCampaigns);
  // }, [campaigns, sortBy]);

  const handleMapLoad = useCallback(() => {
    const map = mapRef?.current?.getMap();
    if (map) {
      setMapBounds(map.getBounds().toArray().flat() as BBox);
    }
  }, []);

  return (
    <div className="flex flex-col">
      <Filter
        setShowMap={setShowMap}
        showMap={showMap}
        switchDisabled={campaigns.length === 0}
        phenomena={phenomena}
      />
      {/* <FiltersBar
          phenomena={phenomena}
          phenomenaState={phenomenaState}
          resetFilters={resetFilters}
          setPhenomenaState={setPhenomenaState}
          setShowMap={setShowMap}
          setSortBy={setSortBy}
          filterObject={filterObject}
          setFilterObject={setFilterObject}
          showMap={showMap}
          sortBy={sortBy}
          switchDisabled={campaigns.length === 0}
        /> */}
      {/* {selectedCampaign && (
          <div className="relative ml-auto inline-block">
            <input type="text" value={selectedCampaign.split("-")[0]} />
            <XMarkIcon
              onClick={() => {
                setSelectedCampaign("");
                resetFilters();
                mapRef.current?.flyTo({
                  center: [0, 0],
                  duration: 1000,
                  zoom: 1,
                });
              }}
              className="absolute right-2 top-2 ml-auto h-5 w-5"
            />
          </div>
        )} */}
      <hr className="w-full bg-gray-700" />
      <div className="relative">
        {!showMap ? (
          <CampaignGrid
            campaigns={campaigns}
            showMap={showMap}
            userId={userId ?? ""}
            campaignCount={campaignCount}
            totalPages={totalPages}
            bookmarks={bookmarks}
          />
        ) : (
          <CampaignMap campaigns={allCampaigns} phenomena={phenomena} />
        )}
      </div>
    </div>
  );
}
