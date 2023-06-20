// Import necessary components and libraries
import { MinusCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import { useState } from "react";
import ProfileVisibilitySwitch from "~/components/profile-visibility-switch";
import {
  getAllBadges,
  getMyBadgesAccessToken,
  getUserBackpack,
} from "~/models/badge.server";
import type { MyBadge } from "~/models/badge.server";
import { getProfileByUserId } from "~/models/profile.server";
import { getUserById } from "~/models/user.server";
import { getUserId } from "~/session.server";

// This function is responsible for loading data for the Profile component
export async function loader({ params, request }: LoaderArgs) {
  const requestingUserId = await getUserId(request);
  // Extract the profile email from the URL params
  const profileId = params.profile;
  if (profileId) {
    const user = await getUserById(profileId);
    const profile = await getProfileByUserId(profileId);

    if (!profile?.public && profileId !== requestingUserId) {
      // If the profile isnt public, return an empty JSON response
      return json({
        success: false,
        userBackpack: [],
        allBadges: [],
        user: null,
        profile: null,
        requestingUserId: requestingUserId,
      });
    }

    const profileMail = user?.email;
    // Get the access token using the getMyBadgesAccessToken function
    const authToken = await getMyBadgesAccessToken().then((authData) => {
      return authData.access_token;
    });
    // Retrieve the user's backpack data and all available badges from the server
    if (profileMail && authToken) {
      const backpackData = await getUserBackpack(profileMail, authToken).then(
        (backpackData) => {
          return backpackData;
        }
      );
      if (!backpackData) {
        return json({
          success: false,
          userBackpack: [],
          allBadges: [],
          user: null,
          profile: null,
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
        user: user,
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

// Define the Profile component
export default function Profile() {
  // Get the data from the loader function using the useLoaderData hook
  const data = useLoaderData<typeof loader>();
  // Define state for the open/closed state of the Profile component
  const [isOpen, setIsOpen] = useState<Boolean>(true);
  const sortedBadges = data.allBadges.sort(
    (badgeA: MyBadge, badgeB: MyBadge) => {
      // Determine if badgeA and badgeB are owned by the user and not revoked
      const badgeAOwned = data.userBackpack.some(
        (obj: MyBadge) => obj.badgeclass === badgeA.entityId && !obj.revoked
      );
      const badgeBOwned = data.userBackpack.some(
        (obj: MyBadge) => obj.badgeclass === badgeB.entityId && !obj.revoked
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
    }
  );

  return (
    <div
      className={
        "w-full bg-white " + (isOpen ? "animate-fade-in-up" : "hidden")
      }
    >
      <div className="flex w-full justify-between bg-green-100">
        <div className="text-l basis-1/4 pb-6 pt-6 text-center font-bold text-white lg:text-3xl">
          {/* display username */}
          {data.profile && <p>{data.profile.name}</p>}
        </div>
        <div className="flex">
          {/* <div className="flex items-center pr-2">
            <MinusCircleIcon
              onClick={() => {
                setIsOpen(!isOpen);
              }}
              className="h-6 w-6 cursor-pointer text-white lg:h-8 lg:w-8"
            />
          </div> */}
          <div className="flex items-center pr-2">
            <Link prefetch="intent" to="/explore">
              <XCircleIcon className="h-6 w-6 cursor-pointer text-white lg:h-8 lg:w-8" />
            </Link>
          </div>
        </div>
      </div>
      {!data.success ? (
        <div className="flex items-center justify-center">
          <p className="p-4">
            Oh no, this does not seem like its a public profile!
          </p>
        </div>
      ) : (
        <div className="flex justify-evenly bg-white">
          {sortedBadges.map((badge: MyBadge, index: number) => {
            return (
              <div
                key={index}
                className="pointer x-auto my-5 flex flex-col items-center"
              >
                <Link
                  to={badge.badgeclassOpenBadgeId}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={badge.image}
                    alt={badge.name}
                    title={badge.name}
                    className={
                      "h-10 w-10 lg:h-20 lg:w-20" +
                      // check if the badge is owned by the user
                      // if so, remove the grayscale filter
                      // if not, add the grayscale filter
                      (data.userBackpack.some((obj: MyBadge) => {
                        return (
                          obj.badgeclass === badge.entityId && !obj.revoked
                        );
                      })
                        ? ""
                        : " grayscale")
                    }
                  />
                </Link>
                <p>{badge.name}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  // when true, this is what used to go to `CatchBoundary`
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>Oops</h1>
        <p>Status: {error.status}</p>
        <p>{error.data.message}</p>
      </div>
    );
  }

  // Don't forget to typecheck with your own logic.
  // Any value can be thrown, not just errors!
  let errorMessage = "Unknown error";
  // if (isDefinitelyAnError(error)) {
  //   errorMessage = error.message;
  // }

  return (
    <div>
      <h1>Uh oh ...</h1>
      <p>Something went wrong.</p>
      <pre>{errorMessage}</pre>
    </div>
  );
}
