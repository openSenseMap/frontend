import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@remix-run/react";
import { t } from "i18next";
import {
  DownloadIcon,
  Share2Icon,
  StarIcon,
  TrashIcon,
  UsersIcon,
} from "lucide-react";
import ShareLink from "~/components/bottom-bar/share-link";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { toast } from "~/components/ui/use-toast";
import { Campaign } from "~/schema";
import { downloadGeojSON } from "~/lib/download-geojson";

type Props = {
  campaign: Campaign;
};

export default function CampaignIdHeader({ campaign }: Props) {
  return (
    <header className="dark:border-green-200 mb-4 flex w-full justify-between rounded-lg border-2 border-green-100 p-4 shadow-md shadow-green-100">
      <div className="flex items-center">
        <h1 className="text-lg font-bold capitalize">
          <b>{campaign.title}</b>
        </h1>
        <div className="ml-2 flex gap-2">
          {/* <ExposureBadge exposure={campaign.exposure} /> */}
          {/* <PriorityBadge priority={campaign.priority} /> */}
        </div>
      </div>
      <div className="hidden gap-6 sm:flex md:flex">
        <Form method="post">
          <input
            className="hidden"
            name="campaignId"
            id="campaignId"
            value={campaign.id}
          />
          <Button
            variant="outline"
            className="flex w-fit gap-2"
            name="_action"
            value="BOOKMARK"
            type="submit"
          >
            {t("bookmark")}{" "}
            <StarIcon
            // className={`h-4 w-4 ${
            //   // bookmarked ? "fill-yellow-300 text-yellow-300" : ""
            // }`}
            />
          </Button>
        </Form>
        {/* <Dialog>
            <DialogTrigger asChild>
              <Button className="flex w-fit gap-2" variant="outline">
                {t("contributors")} <UsersIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>

            <DialogContent className="h-90 overflow-y-scroll">
              <DialogHeader>
                <DialogTitle>{t("contributors")}</DialogTitle>
                <DialogDescription>
                  <Form method="post" className="flex flex-col gap-2">
                    <span className="mx-auto">Message all Participants</span>
                    <textarea id="messageForAll"></textarea>
                    <Button
                      type="submit"
                      name="_action"
                      value="MESSAGE_ALL"
                      className="mx-auto w-fit"
                    >
                      Send
                    </Button>
                  </Form>
                </DialogDescription>
              </DialogHeader>
              {participants.map((p, i) => {
                return (
                  <div
                    key={i}
                    className="flex w-full flex-wrap justify-between"
                  >
                    <span>{p.value}</span>;
                    <MailIcon className="h-4 w-4" />
                  </div>
                );
              })}
            </DialogContent>
          </Dialog> */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex w-fit gap-2 " variant="outline">
              {t("contribute")} <UsersIcon className="h-4 w-4" />{" "}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("contribute")}</DialogTitle>
              <DialogDescription>
                <p className="font-bold">
                  {t(
                    "by clicking on Contribute you agree to be reached out to by the organizer via the email you provided!"
                  )}
                </p>
                <p className="mt-2">
                  {t(
                    "please state if you have the required hardware available"
                  )}
                </p>
              </DialogDescription>
            </DialogHeader>
            <Form method="post">
              <input
                className="hidden"
                value={campaign.id}
                name="campaignId"
                id="campaignId"
              />
              <input
                className="hidden"
                value={campaign.title}
                name="title"
                id="title"
              />
              <input
                className="hidden"
                value={campaign.ownerId}
                name="owner"
                id="owner"
              />
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
                    {t("hardware available")}
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
                {/* <DialogClose> */}
                <Button
                  name="_action"
                  value="PARTICIPATE"
                  type="submit"
                  onClick={() =>
                    toast({
                      title:
                        "Thank you for your interest in contributing to this campaign!",
                      description: (
                        <span>
                          The project owner was notified. Please wait for his
                          instructions
                        </span>
                      ),
                    })
                  }
                >
                  {t("contribute")}
                </Button>
                {/* </DialogClose> */}
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex w-fit gap-2 " variant="outline">
              {t("share")} <Share2Icon className="h-4 w-4" />{" "}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("share")}</DialogTitle>
              <DialogDescription>
                <ShareLink />
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <Button
          variant="outline"
          className="flex w-fit gap-2 "
          // @ts-ignore
          onClick={() => downloadGeojSON(campaign.feature)}
        >
          {t("download GeoJSON")}
          <DownloadIcon className="h-4 w-4" />
        </Button>
        {/* <div className="flex flex-col items-center justify-center">
          <span>{t("show map")}</span>
          <Switch
            id="showMapSwitch"
            checked={showMap}
            onCheckedChange={() => setShowMap(!showMap)}
          />
        </div> */}
        <Dialog>
          <DialogTrigger>
            <Button variant="destructive">
              {t("delete")}
              <TrashIcon className="ml-2 h-4 w-4 text-white" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t("Are you sure that you want to delete this campaign")}
              </DialogTitle>
              <DialogDescription>
                {t(
                  "This action cannot be reversed. Participants will be notified that this campaign was deleted. You can leave a message for the participants in the field below."
                )}
              </DialogDescription>
            </DialogHeader>
            <Form method="post">
              <input
                className="hidden"
                id="campaignId"
                name="campaignId"
                type="text"
                value={campaign.id}
              />
              <input
                className="hidden"
                id="title"
                name="title"
                value={campaign.title}
              />
              <input
                className="hidden"
                id="participants"
                name="participants"
                value={JSON.stringify(campaign.participants)}
              />
              <div className="flex justify-between">
                <DialogClose>
                  <Button variant="outline">{t("cancel")}</Button>
                </DialogClose>
                <Button
                  variant="outline"
                  name="_action"
                  value="DELETE_CAMPAIGN"
                  type="submit"
                  className="float-right bg-red-500 text-white"
                >
                  {t("delete")}{" "}
                  <TrashIcon className="ml-2 h-4 w-4 text-white" />
                </Button>
              </div>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
