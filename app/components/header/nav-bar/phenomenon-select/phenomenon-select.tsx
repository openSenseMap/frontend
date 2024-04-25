import {
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { useTranslation } from "react-i18next";
import type { SensorWikiLabel } from "~/utils/sensor-wiki-helper";
import { sensorWikiLabel } from "~/utils/sensor-wiki-helper";
import type { Key } from "react";
import { useState } from "react";
import { Label } from "~/components/ui/label";
import Spinner from "~/components/spinner";
import type { loader } from "~/routes/explore";
// import SensorWikHoverCard from "~/components/sensor-wiki-hover-card";
import { Button } from "~/components/ui/button";
import { X } from "lucide-react";
import { Checkbox } from "~/components/ui/checkbox";
import { ScrollArea } from "~/components/ui/scroll-area";

export function PhenomenonSelect() {
  const data = useLoaderData<typeof loader>();
  const { t } = useTranslation("navbar");
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  // const [phenomenon, setPhenomenon] = useState<string | undefined>("all");
  const [searchParams, setSearchParams] = useSearchParams();
  const [phenomenonVal, setPhenomenonVal] = useState(
    searchParams.has("phenomenon")
      ? searchParams.get("phenomenon") || undefined
      : "all",
  );
  // const [seeMorePhenomena, setSeeMorePhenomena] = useState(false);

  return (
    <div className="dark:text-zinc-200 flex-col h-full flex-1 gap-2 flex justify-around">
      {navigation.state === "loading" && (
        <div className="bg-gray-100/30 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-[1.5px]">
          <Spinner />
        </div>
      )}
      <ScrollArea className="py-1">
        <div className="grid grid-cols-2 gap-1 py-1">
          {loaderData.phenomena.map(
            (
              p: { slug: string; label: { item: SensorWikiLabel[] } },
              i: Key | null | undefined,
            ) => (
              <div
                key={i}
                className="flex items-center justify-start space-x-2"
              >
                <Checkbox />
                <Label>{sensorWikiLabel(p.label.item)}</Label>
              </div>
            ),
          )}
        </div>
      </ScrollArea>
      {/* <Select
        value={phenomenonVal}
        onValueChange={(value) => {
          setPhenomenonVal(value);
          searchParams.set("phenomenon", value);
          setSearchParams(searchParams);
        }}
      >
        <SelectTrigger className="h-6 w-full text-base">
          <SelectValue className="h-6" placeholder="ALL" />
        </SelectTrigger>
        <SelectContent className="overflow-visible">
          <SelectItem value={"all"}>{t("all_stations")}</SelectItem>

          {loaderData.phenomena &&
            loaderData.phenomena.map(
              (
                p: { slug: string; label: { item: SensorWikiLabel[] } },
                i: Key | null | undefined,
              ) => (
                <SensorWikHoverCard
                  key={i}
                  slug={p.slug}
                  type="phenomena"
                  avoidCollisions={false}
                  side="right"
                  trigger={
                    <SelectItem value={p.slug}>
                      {sensorWikiLabel(p.label.item)}
                    </SelectItem>
                  }
                  openDelay={0}
                  closeDelay={0}
                />
              ),
            )}
        </SelectContent>
      </Select> */}
      <div className="flex justify-between py-1" >
        <Label className="rounded-[5px] border-[1px] border-[#e2e8f0] px-2 py-[1px] text-base leading-[2.2]">
          Results {data.filteredDevices.features.length}
        </Label>
        <Button
          variant="outline"
          className=" px-2 py-[1px] text-base rounded-[5px] border-[1px] border-[#e2e8f0]"
          onClick={() => {
            searchParams.delete("exposure");
            searchParams.delete("status");
            searchParams.delete("phenomenon");
            setSearchParams(searchParams);
          }}
        >
          <span className="flex items-center">
            <X className=" m-0 inline h-3.5 w-3.5 p-0 align-sub" /> Reset
            filters
          </span>
        </Button>
      </div>
    </div>
  );
}
