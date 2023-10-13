import DeviceCard from "~/components/device-card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";

import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getUserId } from "~/session.server";
import { getProfileByUsername } from "~/models/profile.server";
import type { MyBadge } from "~/models/badge.server";
import {
  getAllBadges,
  getMyBadgesAccessToken,
  getUserBackpack,
} from "~/models/badge.server";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { getInitials, getUserImgSrc } from "~/utils/misc";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Info, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useOptionalUser } from "~/utils";
import ErrorMessage from "~/components/error-message";
import DevicesDashboard from "./device._index";


export async function loader({ params, request }: LoaderFunctionArgs) {
  const requestingUserId = await getUserId(request);

  // Get username or userid from URL params
  const username = params.username;

  if (username) {
    // 1. Check if user exists
    const profile = await getProfileByUsername(username);
    if (!profile) {
      throw new Response("not found", { status: 404 });
    }

    // 2. Get profile and if it is private or not me -> throw an error
    // const profile = await getProfileByUserId(user.id);
    if (!profile.public && profile.user.id !== requestingUserId) {
      throw new Response("not found", { status: 404 });
    }

    // 3. If profile is public or logged in user -> return data for profile
    const profileMail = profile.user.email;
    // Get the access token using the getMyBadgesAccessToken function
    const authToken = await getMyBadgesAccessToken().then((authData) => {
      return authData.access_token;
    });

    // Retrieve the user's backpack data and all available badges from the server
    if (profileMail && authToken) {
      const backpackData = await getUserBackpack(profileMail, authToken).then(
        (backpackData) => {
          return backpackData;
        },
      );

      if (profile.user.id !== requestingUserId) {
        profile.user.devices = profile.user.devices.filter(
          (device) => device.public === true,
        );
      }

      if (!backpackData) {
        return json({
          success: false,
          userBackpack: [],
          allBadges: [],
          user: profile.user,
          profile: profile,
          requestingUserId: requestingUserId,
        });
      }

      const allBadges = await getAllBadges(authToken).then((allBadges) => {
        return allBadges.result;
      });

      // Return the fetched data as JSON
      return json({
        success: true,
        userBackpack: backpackData,
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

  // User is optional
  const userOptional = useOptionalUser();

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
    <div className="grid grid-cols-3 gap-8">
      <div className="">
        <div className="flex flex-col space-y-2">
          <Avatar className="h-64 w-64">
            <AvatarImage
              src={getUserImgSrc(profile?.imageId)}
              alt={profile?.username}
            />
            <AvatarFallback>{getInitials(user?.name || "")}</AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-semibold tracking-tight">
            {user?.name}
          </h1>
          <p className="text-sm text-muted-foreground">{profile?.username}</p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Badges</h1>
          <div className="grid grid-cols-4 gap-4 bg-white">
            {sortedBadges.map((badge: MyBadge, index: number) => {
              return (
                <div key={index} className="col-span-1">
                  <Link
                    to={badge.openBadgeId}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Card className="h-full p-2 transition-colors duration-300 ease-in-out hover:bg-slate-100">
                      <CardContent className="flex items-center justify-center p-0">
                        <img
                          src={badge.image}
                          alt={badge.name}
                          title={badge.name}
                          className={
                            "h-10 w-10 lg:h-20 lg:w-20" +
                            // check if the badge is owned by the user
                            // if so, remove the grayscale filter
                            // if not, add the grayscale filter
                            (userBackpack.some((obj: MyBadge) => {
                              return (
                                obj.badgeclass === badge.entityId &&
                                !obj.revoked
                              );
                            })
                              ? ""
                              : " grayscale")
                          }
                        />
                      </CardContent>
                      <CardFooter className="flex items-center justify-center p-0">
                        <p>{badge.name}</p>
                      </CardFooter>
                    </Card>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <div></div>
        </div>
      </div>
      <div className="col-span-2 space-y-4">
        {userOptional?.id === user?.id && user?.devices?.length === 0 ? (
          <Alert>
            <div className="flex justify-between">
              <div className="flex flex-col">
                <div className="flex">
                  <Info className="h-4 w-4" />
                  <AlertTitle className="ml-4">
                    You have no device registered
                  </AlertTitle>
                </div>
                <AlertDescription>
                  You can add up to 3 devices to your account.
                </AlertDescription>
              </div>
              <Button variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        ) : null}
        {(userOptional?.id === user?.id || user?.devices?.length) === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle className="ml-6">
              This user has no public devices.
            </AlertTitle>
          </Alert>
        ) : null}
        <div className="col-span-2">
          {/* show devices dashboard */}
          {/* {user?.devices && (
            <div className="py-8">
              <div>
                <h2 className="text-2xl font-semibold leading-tight">
                  List of my Devices
                </h2>
              </div>
              
              <div className="mx-auto py-3">
                <DataTable columns={columns} data={user.devices} />
              </div>
            </div>
          )} */}

          {user?.devices && (
            <DevicesDashboard devices={user.devices}></DevicesDashboard>
          )}
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="w-full flex items-center justify-center">
      <ErrorMessage />
    </div>
  );
}
