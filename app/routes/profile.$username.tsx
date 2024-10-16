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
import { cn } from "~/lib/utils";
import type { BadgeClass } from "~/utils";
import { getUniqueActiveBadges, sortBadges } from "~/utils";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const requestingUserId = await getUserId(request);
  // Get username or userid from URL params
  const username = params.username;

  if (username) {
    // Check if user exists
    const profile = await getProfileByUsername(username);
    // If the user exists and their profile is public, fetch their data or
    if (
      (!profile || !profile.public) &&
      requestingUserId !== profile?.user?.id
    ) {
      return redirect("/explore");
    } else {
      const profileMail = profile?.user?.email || "";
      // Get the access token using the getMyBadgesAccessToken function
      const authToken = await getMyBadgesAccessToken().then((authData) => {
        return authData.access_token;
      });

      // Retrieve the user's backpack data and all available badges from the server
      const backpackData = await getUserBackpack(profileMail, authToken).then(
        (backpackData: MyBadge[]) => {
          return getUniqueActiveBadges(backpackData);
        },
      );

      const allBadges = await getAllBadges(authToken).then((allBadges) => {
        return allBadges.result as BadgeClass[];
      });

      // Return the fetched data as JSON
      return json({
        userBackpack: backpackData || [],
        allBadges: allBadges,
        profile: profile,
        requestingUserId: requestingUserId,
      });
    }
  }

  // If the user data couldn't be fetched, return an empty JSON response
  return json({
    userBackpack: [],
    allBadges: [],
    profile: null,
    requestingUserId: requestingUserId,
  });
}

export default function () {
  // Get the data from the loader function using the useLoaderData hook
  const { allBadges, userBackpack, profile } = useLoaderData<typeof loader>();

  const sortedBadges = sortBadges(allBadges, userBackpack);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full md:pt-4 p-8">
        <div className="bg-white dark:bg-dark-background shadow-lg p-6 rounded-xl flex flex-col gap-6 w-full md:w-1/3">
          <div className="flex items-center gap-4 dark:text-dark-text">
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
              <h3 className="text-2xl font-semibold dark:text-dark-text">
                {profile?.user?.name || ""}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                User since{" "}
                {new Date(profile?.user?.createdAt || "").toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:pt-6">
            <div className="bg-gray-100 dark:bg-dark-boxes rounded-lg p-4 flex flex-col items-center">
              <span className="text-2xl font-bold dark:text-dark-green">
                {profile?.user?.devices.length}
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                Devices
              </span>
            </div>
            <div className="bg-gray-100 dark:bg-dark-boxes rounded-lg p-4 flex flex-col items-center">
              <span className="text-2xl font-bold dark:text-dark-green">
                coming soon
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                Sensors
              </span>
            </div>
            <div className="bg-gray-100 dark:bg-dark-boxes rounded-lg p-4 flex flex-col items-center">
              <span className="text-2xl font-bold dark:text-dark-green">
                coming soon
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
          <div className="bg-white dark:bg-dark-background shadow-lg p-6 rounded-xl">
            <div className="text-3xl font-semibold mb-4 text-light-green dark:text-dark-green">
              Badges
            </div>
            <section className="w-full py-12 md:py-16 lg:py-20">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedBadges.map((badge: BadgeClass) => {
                  return (
                    <Link
                      to={badge.openBadgeId}
                      target="_blank"
                      rel="noopener noreferrer"
                      key={badge.entityId}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 dark:border-gray-800 dark:text-dark-text",
                          userBackpack.some((obj: MyBadge | null) => {
                            return (
                              obj !== null &&
                              obj.badgeclass === badge.entityId &&
                              !obj.revoked
                            );
                          })
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : "bg-gray-100 dark:bg-dark-boxes",
                        )}
                      >
                        <img
                          alt="Design"
                          className="h-6 w-6 rounded-full"
                          height={24}
                          src={badge.image}
                          style={{
                            aspectRatio: "24/24",
                            objectFit: "cover",
                          }}
                          width={24}
                        />
                        <span className="text-sm font-medium">
                          {badge.name}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
          <div className="bg-white dark:bg-dark-background shadow-lg p-6 rounded-xl">
            {profile?.user?.devices && (
              <>
                <div className="text-3xl font-semibold mb-4 text-light-green dark:text-dark-green">
                  Devices
                </div>
                <DataTable columns={columns} data={profile?.user.devices} />
              </>
            )}
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
