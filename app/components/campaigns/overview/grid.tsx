// import type { Campaign, CampaignBookmark, User } from "@prisma/client";
import type { Campaign } from "~/schema";
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
import { Link, Form } from "@remix-run/react";
import { ExposureBadge, PriorityBadge } from "./campaign-badges";
import { PlusIcon, StarIcon } from "lucide-react";
import { Progress } from "~/components/ui/progress";
import Markdown from "markdown-to-jsx";
import { CountryFlagIcon } from "~/components/ui/country-flag";
import { useTranslation } from "react-i18next";
import Pagination from "./pagination";

type CampaignGridProps = {
  campaigns: any[];
  showMap: boolean;
  userId: string;
  campaignCount: number;
  totalPages: number;
  // bookmarks: CampaignBookmark[];
};

export default function CampaignGrid({
  campaigns,
  showMap,
  userId,
  campaignCount,
  totalPages,
  // bookmarks,
}: CampaignGridProps) {
  const { t } = useTranslation("explore-campaigns");

  const CampaignInfo = () => (
    <span className="mx-auto sm:col-span-2 md:absolute md:left-0 md:top-0 md:col-span-3">
      {campaigns.length} {t("of")} {campaignCount} {t("campaigns are shown")}
    </span>
  );

  if (campaigns.length === 0) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-2">
        <span className="mt-6 text-red-500">{t("no campaigns yet")}. </span>{" "}
        <div>
          {t("click")}{" "}
          <Link className="text-blue-500 underline" to="../../create/area">
            {t("here")}
          </Link>{" "}
          {t("to create a campaign")}
        </div>
      </div>
    );
  }
  return (
    <div
      className={`mt-10 grid w-full grid-cols-1 gap-4 ${
        showMap ? "order-2 md:order-1" : "sm:grid-cols-2 md:grid-cols-3"
      }`}
    >
      <CampaignInfo />
      {campaigns.map((item: Campaign, index: number) => {
        // const isBookmarked =
        //   userId &&
        //   bookmarks.find(
        //     (bookmark: CampaignBookmark) =>
        //       bookmark.userId === userId && bookmark.campaignId === item.id
        //   );
        return (
          <Link to={`../${item.slug}`} key={item.id}>
            <Card key={item.id} className="col-span-1">
              <CardHeader>
                <CardTitle>
                  <div className="mb-4 flex w-full justify-between">
                    <div>
                      <Form method="post">
                        <input
                          className="hidden"
                          name="campaignId"
                          id="campaignId"
                          value={item.id}
                        />
                        <button
                          type="submit"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <StarIcon
                            className={`h-4 w-4 ${
                              // isBookmarked && "fill-yellow-300 text-yellow-300"
                            ""}`}
                          />
                        </button>
                      </Form>
                    </div>
                    <div className="flex gap-2">
                      {/* <ExposureBadge exposure={item.exposure} /> */}
                      {/* <PriorityBadge priority={item.priority} /> */}
                    </div>
                  </div>
                  <div className="w-full">
                    <div className="flex items-center justify-between gap-2 truncate">
                      <span>{item.title} </span>
                      <div className="flex">
                        {item.countries && item.countries.map(
                          (country: string, index: number) => {
                            if (index === 2) {
                              return (
                                <PlusIcon
                                  key={index}
                                  className="h-6 w-6 border-2 border-black"
                                />
                              );
                            }
                            const flagIcon = CountryFlagIcon({
                              country: String(country).toUpperCase(),
                            });
                            if (!flagIcon) return null;
                            return (
                              <div
                                key={index}
                                // className="overflow-hidden hover:overflow-visible"
                              >
                                <div className="">{flagIcon}</div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-2">
                <Progress
                  max={item.minimumParticipants ?? 0}
                  // value={item.participants.length}
                  // onMouseEnter={}
                />
                <span>
                  {item.minimumParticipants} {t("total participants")}
                </span>
              </CardContent>
              <CardFooter>
                <Accordion className="w-full" type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-blue-600 hover:text-blue-800">
                      {t("learn more")}
                    </AccordionTrigger>
                    <AccordionContent>
                      <Markdown>{item.description}</Markdown>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardFooter>
            </Card>
          </Link>
        );
      })}
      {totalPages > 1 && (
        <>
          <div className="col-span-1"></div>
          <div className="col-span-1">
            <Pagination
              totalPages={totalPages}
              pageParam="page"
              className="mt-8"
            />
          </div>
          <div className="col-span-1"></div>
        </>
      )}
    </div>
  );
}
