import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getUserId } from "~/session.server";
import { getProfileByUsername } from "~/models/profile.server";
import type { MyBadge } from "~/models/badge.server";
import {
  getAllBadges,
  getMyBadgesAccessToken,
  getUserBackpack,
} from "~/models/badge.server";
import { getInitials } from "~/utils/misc";
import ErrorMessage from "~/components/error-message";
import { DataTable } from "~/components/mydevices/dt/data-table";
import { columns } from "~/components/mydevices/dt/columns";
import { Badge } from "~/components/ui/badge";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const requestingUserId = await getUserId(request);

  // Get username or userid from URL params
  const username = params.username;

  if (username) {
    // 1. Check if user exists
    const profile = await getProfileByUsername(username);

    if (!profile || !profile.public) {
      redirect("/explore");
    } else {
      const profileMail = profile.user?.email || "";
      // Get the access token using the getMyBadgesAccessToken function
      const authToken = await getMyBadgesAccessToken().then((authData) => {
        return authData.access_token;
      });

      // Retrieve the user's backpack data and all available badges from the server
      const backpackData = await getUserBackpack(profileMail, authToken).then(
        (backpackData) => {
          return backpackData;
        },
      );

      const allBadges = await getAllBadges(authToken).then((allBadges) => {
        return allBadges.result;
      });

      // Return the fetched data as JSON
      return json({
        success: true,
        userBackpack: backpackData ? backpackData : [],
        allBadges: allBadges,
        user: profile.user,
        profile: profile,
        requestingUserId: requestingUserId,
      });
    }
  }

  // If the user data couldn't be fetched, return an empty JSON response
  return json({
    success: false,
    userBackpack: [],
    allBadges: [],
    user: null,
    profile: null,
    requestingUserId: requestingUserId,
  });
}

export default function () {
  // Get the data from the loader function using the useLoaderData hook
  const { allBadges, userBackpack, user, profile } =
    useLoaderData<typeof loader>();
  console.log("🚀 ~ user:", user);

  const sortedBadges = allBadges.sort((badgeA: MyBadge, badgeB: MyBadge) => {
    // Determine if badgeA and badgeB are owned by the user and not revoked
    const badgeAOwned = userBackpack.some(
      (obj: MyBadge) => obj.badgeclass === badgeA.entityId && !obj.revoked,
    );
    const badgeBOwned = userBackpack.some(
      (obj: MyBadge) => obj.badgeclass === badgeB.entityId && !obj.revoked,
    );
    // Sort badges based on ownership:
    // Owned badges come first, followed by non-owned badges
    if (badgeAOwned && !badgeBOwned) {
      return -1;
    } else if (!badgeAOwned && badgeBOwned) {
      return 1;
    } else {
      // If both badges are owned or both are non-owned,
      // maintain their original order
      return 0;
    }
  });

  return (
    <>
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full bg-white dark:bg-dark-background md:pt-4">
        <div className="bg-white dark:bg-dark-background shadow-sm p-6 flex flex-col gap-6 w-full md:w-1/3">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                className="aspect-auto w-full h-full rounded-full object-cover"
                src={"/resources/file/" + profile?.profileImage?.id}
              />
              <AvatarFallback>
                {getInitials(profile?.username ?? "")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold dark:text-dark-text">
                {user?.name || ""}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                User since{" "}
                {new Date(user?.createdAt || "").toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:pt-6">
            <div className="bg-gray-100 dark:bg-dark-boxes rounded-lg p-4 flex flex-col items-center">
              <span className="text-2xl font-bold dark:text-dark-green">
                {user?.devices.length}
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                Devices
              </span>
            </div>
            <div className="bg-gray-100 dark:bg-dark-boxes rounded-lg p-4 flex flex-col items-center">
              <span className="text-2xl font-bold dark:text-dark-green">
                38
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                Sensors
              </span>
            </div>
            <div className="bg-gray-100 dark:bg-dark-boxes rounded-lg p-4 flex flex-col items-center">
              <span className="text-2xl font-bold dark:text-dark-green">
                120k
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                Measurements
              </span>
            </div>
            <div className="bg-gray-100 dark:bg-dark-boxes rounded-lg p-4 flex flex-col items-center">
              <span className="text-2xl font-bold dark:text-dark-green">
                {userBackpack.length}
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                Badges
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6 w-full md:w-2/3">
          <div className="bg-white dark:bg-dark-background shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 text-light-green dark:text-dark-green">
              Badges
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {sortedBadges.map((badge: MyBadge) => {
                return (
                  <Link
                    to={badge.openBadgeId}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={badge.entityId}
                  >
                    <Badge
                      variant="secondary"
                      className={
                        // check if the badge is owned by the user
                        // if so, remove the grayscale filter
                        // if not, add the grayscale filter
                        userBackpack.some((obj: MyBadge) => {
                          return (
                            obj.badgeclass === badge.entityId && !obj.revoked
                          );
                        })
                          ? "border-transparent dark:border-transparent bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                          : "border-transparent dark:border-transparent bg-gray-100 dark:bg-dark-boxes"
                      }
                    >
                      {badge.name}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="bg-white dark:bg-dark-background shadow-sm p-6">
            {user?.devices ? (
              <>
                <h3 className="text-lg font-semibold mb-4 text-light-green dark:text-dark-green">
                  Devices
                </h3>
                <DataTable columns={columns} data={user.devices} />
              </>
            ) : // TODO: empty and private profiles
            null}
          </div>
        </div>
      </div>
    </>
  );
}

export function ErrorBoundary() {
  return (
    <div className="w-full flex items-center justify-center">
      <ErrorMessage />
    </div>
  );
}
