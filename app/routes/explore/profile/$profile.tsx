// Import necessary components and libraries
import { MinusCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useCatch, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import {
  MyBadge,
  getAllBadges,
  getMyBadgesAccessToken,
  getUserBackpack,
} from "~/models/badge.server";

// This function is responsible for loading data for the Profile component
export async function loader({ params }: LoaderArgs) {
  // Extract the profile email from the URL params
  const profileMail = params.profile;
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

    const allBadges = await getAllBadges(authToken).then((allBadges) => {
      return allBadges.result;
    });

    // Return the fetched data as JSON
    return json({
      success: true,
      userBackpack: backpackData,
      allBadges: allBadges,
      email: profileMail,
    });
  }
  // If the user data couldn't be fetched, return an empty JSON response
  return json({
    success: false,
    userBackpack: [],
    allBadges: [],
    email: profileMail,
  });
}

// Define the Profile component
export default function Profile() {
  // Define state for the open/closed state of the Profile component
  const [isOpen, setIsOpen] = useState<Boolean>(true);
  // Get the data from the loader function using the useLoaderData hook
  const data = useLoaderData<typeof loader>();
  const sortedBadges = data.allBadges.sort((badgeA: MyBadge, badgeB: MyBadge) => {
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
  });
  return (
    <div
      className={
        "w-full bg-white " + (isOpen ? "animate-fade-in-up" : "hidden")
      }
    >
      <div className="flex w-full justify-between bg-green-100">
        <div className="text-l basis-1/4 pt-6 pb-6 text-center font-bold text-white lg:text-3xl">
          <p>{data.email}</p>
        </div>
        <div className="flex">
          <div className="flex items-center pr-2">
            <MinusCircleIcon
              onClick={() => {
                setIsOpen(!isOpen);
              }}
              className="h-6 w-6 cursor-pointer text-white lg:h-8 lg:w-8"
            />
          </div>
          <div className="flex items-center pr-2">
            <Link prefetch="intent" to="/explore">
              <XCircleIcon className="h-6 w-6 cursor-pointer text-white lg:h-8 lg:w-8" />
            </Link>
          </div>
        </div>
      </div>
      {!data.success ? (
        <div className="text-red-500">
          Oh no, we could not find this Profile. Are you sure it exists?
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

export function CatchBoundary() {
  const caught = useCatch();
  if (caught.status === 500) {
    return (
      <div>
        <div className="flex animate-fade-in-up items-center justify-center bg-white py-10">
          <div className="text-red-500">
            Oh no, we could not find this Profile. Are you sure it exists?
          </div>
        </div>
      </div>
    );
  }
  throw new Error(`Unsupported thrown response status code: ${caught.status}`);
}
