import {
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { cn } from "~/lib/utils";
import { sensorWikiLabel } from "~/utils/sensor-wiki-helper";
import { getPhenomena, type Phenomenon } from "~/models/phenomena.server";
import { json, type LoaderArgs } from "@remix-run/node";
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

export const loader = async ({ request }: LoaderArgs) => {
  const phenomena = await getPhenomena();
  return json({ phenomena });
};
export function PhenomenonSelect() {
  const { t } = useTranslation("navbar");
  const loaderData = useLoaderData();
  const navigation = useNavigation();
  // const [phenomenon, setPhenomenon] = useState<string | undefined>("all");
  const [searchParams, setSearchParams] = useSearchParams();
  const [phenomenonVal, setPhenomenonVal] = useState(
    searchParams.has("mapPheno")
      ? searchParams.get("mapPheno") || undefined
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
          searchParams.set("mapPheno", value);
          setSearchParams(searchParams);
        }}
      >
        <SelectTrigger className="h-6 w-full text-base">
          <SelectValue className="h-6" placeholder="ALL" />
        </SelectTrigger>
        <SelectContent className="">
          <SelectItem value={"all"}>{t("all_stations")}</SelectItem>

          {loaderData.phenomena.map((p, i) => (
            <SelectItem key={i} value={p.slug}>
              {sensorWikiLabel(p.label.item)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
