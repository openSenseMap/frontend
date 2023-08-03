import type { Campaign, User } from "@prisma/client";
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
import { StarIcon } from "lucide-react";
import { Progress } from "~/components/ui/progress";
import Markdown from "markdown-to-jsx";
import { CountryFlagIcon } from "~/components/ui/country-flag";
import { useTranslation } from "react-i18next";

type CampaignGridProps = {
  campaigns: Campaign[];
  showMap: boolean;
  userId: string;
};

export default function CampaignGrid({
  campaigns,
  showMap,
  userId,
}: CampaignGridProps) {
  const { t } = useTranslation("overview");
  return (
    <>
      {campaigns.length > 0 && (
        <>
          {campaigns.map((item: Campaign, index: number) => (
            <Card
              key={item.id}
              className="min-w-fit md:w-[320px] lg:w-[320px] xl:w-[350px]"
            >
              <Link to={`../${item.slug}`}>
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
                            {userId &&
                            item.bookmarkedByUsers.some(
                              (user: User) => user.id === userId
                            ) ? (
                              <StarIcon className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                            ) : (
                              <StarIcon className="h-4 w-4" />
                            )}
                          </button>
                        </Form>
                      </div>
                      <div className="flex gap-2">
                        <ExposureBadge exposure={item.exposure} />
                        <PriorityBadge priority={item.priority} />
                      </div>
                    </div>
                    <span className="flex justify-between">
                      {item.title}{" "}
                      {item.country && (
                        <CountryFlagIcon
                          country={String(item.country).toUpperCase()}
                        />
                      )}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="mt-2">
                  <Progress
                    max={item.minimumParticipants ?? 0}
                    value={item.participants.length}
                    // onMouseEnter={}
                  />
                  <span>
                    {item.minimumParticipants} {t("total participants")}
                  </span>
                </CardContent>
              </Link>
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
          ))}
        </>
      )}
    </>
  );
}
