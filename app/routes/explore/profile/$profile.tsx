// Import necessary components and libraries
import { MinusCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useCatch, useLoaderData } from "@remix-run/react";
import { useState } from "react";

// Define the structure of the MyBadge object
interface MyBadge {
  acceptance: string;
  badgeclass: string;
  badgeclassOpenBadgeId: string;
  entityId: string;
  entityType: string;
  expires: null | string;
  image: string;
  issuedOn: string;
  issuer: string;
  issuerOpenBadgeId: string;
  name: string;
  narrative: null | string;
  openBadgeId: string;
  pending: boolean;
  recipient: {
    identity: string;
    hashed: boolean;
    type: string;
    plaintextIdentity: string;
    salt: string;
  };
  revocationReason: null | string;
  revoked: boolean;
}

// This function is responsible for loading data for the Profile component
export async function loader({ params }: LoaderArgs) {
  // Extract the profile email from the URL params
  const profileMail = params.profile;

  // Make a request to get an access token from the MyBadges API
  const authRequest = new Request(process.env.MYBADGES_API_URL + "o/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "password",
      username: `${process.env.MYBADGES_SERVERADMIN_USERNAME}`,
      password: `${process.env.MYBADGES_SERVERADMIN_PASSWORD}`,
      client_id: `${process.env.MYBADGES_CLIENT_ID}`,
      client_secret: `${process.env.MYBADGES_CLIENT_SECRET}`,
      scope: "rw:serverAdmin",
    }),
  });
  const authResponse = await fetch(authRequest);
  const authData = await authResponse.json();
  const accessToken = authData?.access_token;

  // Make a request to the backpack endpoint with the bearer token
  const backpackRequest = new Request(
    process.env.MYBADGES_API_URL + "v2/backpack/" + profileMail,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const backpackResponse = await fetch(backpackRequest);
  const backpackData = await backpackResponse.json();

  // filter the badges by issuer (only OSeM badges)
  const filteredBadgeData = backpackData.result?.filter(
    (badge: MyBadge) => badge.issuer === process.env.MYBADGES_ISSUERID_OSEM
  );
  const filteredBackpackData = {
    success: backpackData.status.success,
    badges: filteredBadgeData,
    email: profileMail,
  };

  // Return the backpack data as JSON
  return json(filteredBackpackData);
}

// Define the Profile component
export default function Profile() {
  // Define state for the open/closed state of the Profile component
  const [isOpen, setIsOpen] = useState<Boolean>(true);
  // Get the data from the loader function using the useLoaderData hook
  const data = useLoaderData<typeof loader>();
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
          {data.badges.map((badge: MyBadge, index: number) => {
            return (
              <div key={index}>
                <Link
                  to={badge.badgeclassOpenBadgeId}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={badge.image}
                    alt={badge.name}
                    title={badge.name}
                    className="mx-auto my-5 h-10 w-10 lg:h-20 lg:w-20"
                  />
                </Link>
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
