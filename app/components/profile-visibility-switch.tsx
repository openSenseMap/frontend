import { Link, useLoaderData, useMatches } from "@remix-run/react";
import { useState } from "react";
import { Switch } from "./ui/switch";
import type { loader } from "~/routes/explore";
import { useTranslation } from "react-i18next";
import { User } from "lucide-react";

export default function ProfileVisibilitySwitch() {
  const { t } = useTranslation("menu");

  // Get the data from the loader function using the useLoaderData hook
  const data = useLoaderData<typeof loader>();
  const matches = useMatches();

  const [isPublic, setIsPublic] = useState<boolean>(
    data.profile?.public === true ? true : false
  );
  // const [loading, setLoading] = useState<boolean>(false);

  const handleSwitchChange = (
    newValue: boolean | ((prevState: boolean) => boolean)
  ) => {
    // Update the state
    // setLoading(true);
    setIsPublic(newValue);

    // Send a POST request here
    fetch("/explore/profile/" + data.user?.id + "/changeVisibility", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newVisibility: newValue }),
    })
      .then((response) => {
        // setLoading(false);
        // Handle the response
        if (response.ok) {
          console.log("Profile visibility updated successfully");
        } else {
          console.log("Failed to update profile visibility");
        }
      })
      .catch((error) => {
        // setLoading(false);
        console.log(
          "An error occurred while updating profile visibility:",
          error
        );
      });
  };
  return (
    <div className="flex w-full items-center justify-between">
      <Link
        to={{
          pathname: "/explore/profile/me",
        }}
        className="w-full"
        onClick={(event) => {
          if (
            data.profile?.userId === matches[matches.length - 1].params.profile
          ) {
            event.preventDefault();
          }
        }}
      >
        <div
          className={
            "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground"
          }
        >
          <User className="mr-2 h-5 w-5" />
          <span>{t("profile_label")}</span>
        </div>
      </Link>
      <div
        className="flex items-center justify-center gap-2"
        onClick={(event) => {
          event.preventDefault();
        }}
      >
        <Switch
          id="publicProfile"
          name="publicProfile"
          checked={isPublic}
          onCheckedChange={handleSwitchChange}
          className=""
        />
      </div>
    </div>
  );
}
