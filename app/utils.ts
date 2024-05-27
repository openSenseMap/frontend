import { useMatches } from "@remix-run/react";
import type { User } from "~/schema";
import moment from "moment";
import { useMemo } from "react";
import { MyBadge } from "./models/badge.server";

const DEFAULT_REDIRECT = "/";

export interface BadgeClass {
  entityType: string;
  entityId: string;
  openBadgeId: string;
  createdAt: string;
  createdBy: string;
  issuer: string;
  issuerOpenBadgeId: string;
  name: string;
  image: string;
  description: string;
  criteriaUrl: string | null;
  criteriaNarrative: string;
  alignments: any[];
  tags: any[];
  expires: any;
  extensions: any;
}

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 */
export function safeRedirect(
  to: FormDataEntryValue | string | null | undefined,
  defaultRedirect: string = DEFAULT_REDIRECT,
) {
  if (!to || typeof to !== "string") {
    return defaultRedirect;
  }

  if (!to.startsWith("/") || to.startsWith("//")) {
    return defaultRedirect;
  }

  return to;
}

/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} id The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(
  id: string,
): Record<string, unknown> | undefined {
  const matchingRoutes = useMatches();
  const route = useMemo(
    () => matchingRoutes.find((route) => route.id === id),
    [matchingRoutes, id],
  );

  return route?.data as Record<string, unknown>;
}

function isUser(user: any): user is User {
  return user && typeof user === "object" && typeof user.email === "string";
}

export function useOptionalUser(): User | undefined {
  const data = useMatchesData("root");
  if (!data || !isUser(data.user)) {
    return undefined;
  }
  return data.user;
}

export function useUser(): User {
  const maybeUser = useOptionalUser();
  if (!maybeUser) {
    throw new Error(
      "No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead.",
    );
  }
  return maybeUser;
}

export function validateEmail(email: unknown): email is string {
  return typeof email === "string" && email.length > 3 && email.includes("@");
}

//* validate user name in join page
export function validateName(name: string) {
  if (name.length === 0) {
    return { isValid: false, errorMsg: "Name is required" };
  } else if (name.length < 4) {
    return { isValid: false, errorMsg: "Please use at least 4 characters." };
  } else if (
    name &&
    !/^[a-zA-Z0-9][a-zA-Z0-9\s._-]+[a-zA-Z0-9-_.]$/.test(name.toString())
  ) {
    return { isValid: false, errorMsg: "Name is invalid" };
  }

  return { isValid: true };
}

//* validate passwords type (changePassword page)
export function validatePassType(passwords: any) {
  const index = passwords.findIndex(
    (password: any) => typeof password !== "string" || password.length === 0,
  );
  return { isValid: index == -1 ? true : false, index: index };
}

//* validate passwords length (changePassword page)
export function validatePassLength(passwords: any) {
  const index = passwords.findIndex((password: any) => password.length < 8);
  return { isValid: index == -1 ? true : false, index: index };
}

/**
 * This function is called in the loader of /explore route. It return list of devices based on user selected filters.

 * @param devices all devices data
 * @param filterParams attributes and selected values
 */
export function getFilteredDevices(
  devices: any,
  filterParams: URLSearchParams,
) {
  // check if any filter is selected
  if (
    filterParams.has("exposure") ||
    filterParams.has("status") ||
    filterParams.has("phenomenon")
  ) {
    // set list here for computational efficiency
    const phenomenonList = filterParams.get("phenomenon")?.split(",");
    // map through all devices and filter based on selected values
    let results = devices.features.filter((device: any) => {
      // get list of sensors for device
      const sensorsList = device.properties.sensors?.map((s: any) => s.title);
      return (
        // check if selected values match device attributes
        (!filterParams.get("exposure") ||
          filterParams.get("exposure")?.toLowerCase() ===
            device.properties.exposure.toLowerCase()) &&
        (!filterParams.get("status") ||
          filterParams.get("status")?.toLowerCase() ===
            device.properties.status.toLowerCase()) &&
        (!filterParams.get("phenomenon") ||
          sensorsList.some((s: any) =>
            phenomenonList?.includes(s.toLowerCase()),
          ))
      );
    });
    // return filtered devices
    return {
      type: "FeatureCollection",
      features: results,
    };
  } else {
    // return all devices
    return {
      type: "FeatureCollection",
      features: devices.features,
    };
  }
}

//* Get Minute Formatted String - last sensor measurement update
export function getMinuteFormattedString(lastMeasurementAt: string) {
  const secondsAgo = moment().diff(moment(lastMeasurementAt), "seconds");

  if (secondsAgo === null || secondsAgo === undefined) {
    return "-";
  } else {
    if (secondsAgo < 120) {
      return "now";
    }
    return `${Math.floor(secondsAgo / 60)} minutes ago`;
  }
}

export function diffFromCreateDate(DeviceCreatedAt: string) {
  const createDate = moment(DeviceCreatedAt);
  const yearsFromCreate = moment().diff(createDate, "years");
  return `Created ${
    yearsFromCreate === 0
      ? `${moment().diff(createDate, "days")} day(s)`
      : `${yearsFromCreate} year` + (yearsFromCreate > 1 ? "s" : "")
  } ago`;
}

/**
 * Returns only unique badges that have not been revoked.
 * @param {MyBadge[]} badges - Array of badge objects.
 * @returns {MyBadge[]} - Array of unique, non-revoked badges.
 */
export function getUniqueActiveBadges(badges: MyBadge[]): MyBadge[] {
  // Create a set to track unique badge class IDs
  const uniqueBadgeClassIds = new Set<string>();

  // Filter the badges
  return badges.filter((badge) => {
    // Check if the badge is not revoked and has a unique badge class ID
    if (
      !badge.revoked &&
      !uniqueBadgeClassIds.has(badge.badgeclassOpenBadgeId)
    ) {
      // Add the badge class ID to the set
      uniqueBadgeClassIds.add(badge.badgeclassOpenBadgeId);
      return true;
    }
    return false;
  });
}

/**
 * Sorts the badges so that the owned ones have the first positions in the array.
 * @param {BadgeClass[] | (BadgeClass | null)[]} allBadges - Array of all existing badge class objects.
 * @param {MyBadge[] | (MyBadge | null)[]} ownedBadges - Array of badges owned by the user.
 * @returns {BadgeClass[]} - Sorted array of badge classes.
 */
export function sortBadges(
  allBadges: (BadgeClass | null)[],
  ownedBadges: (MyBadge | null)[],
): BadgeClass[] {
  // Filter out null values from allBadges and ownedBadges
  const validAllBadges = allBadges.filter(
    (badge): badge is BadgeClass => badge !== null,
  );
  const validOwnedBadges = ownedBadges.filter(
    (badge): badge is MyBadge => badge !== null,
  );

  // Create a set of owned badge class IDs
  const ownedBadgeClassIds = new Set<string>(
    validOwnedBadges.map((badge) => badge.badgeclassOpenBadgeId),
  );

  // Sort the badges such that owned badges come first
  return validAllBadges.sort((a, b) => {
    const aOwned = ownedBadgeClassIds.has(a.openBadgeId);
    const bOwned = ownedBadgeClassIds.has(b.openBadgeId);
    return aOwned === bOwned ? 0 : aOwned ? -1 : 1;
  });
}
