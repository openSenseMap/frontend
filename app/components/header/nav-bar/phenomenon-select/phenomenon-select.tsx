import {
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { cn } from "~/lib/utils";
import type { SensorWikiLabel } from "~/utils/sensor-wiki-helper";
import { sensorWikiLabel } from "~/utils/sensor-wiki-helper";
import type { Key } from "react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "~/components/ui/label";
import Spinner from "~/components/spinner";
import type { loader } from "~/routes/explore";
import SensorWikHoverCard from "~/components/sensor-wiki-hover-card";

export function PhenomenonSelect() {
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
    <div className={cn("grid gap-2", "w-fit")}>
      {navigation.state === "loading" && (
        <div className="bg-gray-100/30 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-[1.5px]">
          <Spinner />
        </div>
      )}
      <Label className=" text-base">{t("choose_phenomenon")}</Label>
      <Select
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
      </Select>
    </div>
  );
}
