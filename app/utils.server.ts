import moment from "moment";
import { useMemo } from "react";
import { useMatches } from "react-router";
import {
  validateUsername,
  validateEmail as validateEmailNew,
} from "./lib/user-service.server";
import { type MyBadge } from "./models/badge.server";
import { type User } from "./schema/user";

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
  expires?: any;
  extensions?: any;
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
 * Validates an email against common criteria.
 * @deprecated Use {@link validateEmailNew} instead
 */
export function validateEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  return validateEmailNew(email).isValid;
}

/**
 * Validates a username against set criteria.
 * @deprecated Use {@link validateUsername} instead
 */
export function validateName(name: string) {
  const { required, length, invalidCharacters } = validateUsername(name);
  if (required) return { isValid: false, errorMsg: "Name is required" };
  else if (length)
    return { isValid: false, errorMsg: "Please use at least 4 characters." };
  else if (invalidCharacters)
    return { isValid: false, errorMsg: "Name is invalid" };

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

export function getFilteredDevices(
  devices: any,
  filterParams: URLSearchParams,
) {
  const statusFilter = filterParams.get("status")?.toLowerCase().split(",") || [
    "all",
  ];
  const exposureFilter = filterParams
    .get("exposure")
    ?.toLowerCase()
    .split(",") || ["all"];
  const phenomenonList = filterParams
    .get("phenomenon")
    ?.toLowerCase()
    .split(",");
  const tagsFilter = filterParams.get("tags")?.toLowerCase().split(",") || [];
  let results = devices.features.filter((device: any) => {
    const sensorsList = device.properties.sensors?.map((s: any) =>
      s.title.toLowerCase(),
    );
    const deviceTags =
      device.properties.tags?.map((tag: string) => tag.toLowerCase()) || []; // Convert device tags to lowercase

    return (
      // If "all" is selected, include all exposures; otherwise, check for matches
      // If tags are provided, check if the device contains any of the selected tags
      (exposureFilter.includes("all") ||
        exposureFilter.includes(device.properties.exposure.toLowerCase())) &&
      // If "all" is selected, include all statuses; otherwise, check for matches
      (statusFilter.includes("all") ||
        statusFilter.includes(device.properties.status.toLowerCase())) &&
      // If phenomenon is provided, check if any sensor matches the selected phenomenon
      (!filterParams.get("phenomenon") ||
        sensorsList.some((s: any) => phenomenonList?.includes(s))) &&
      (tagsFilter.length === 0 ||
        tagsFilter.some((tag) => deviceTags.includes(tag)))
    );
  });

  return {
    type: "FeatureCollection",
    features: results,
  };
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
  // Check if the badges array is empty
  if (!badges) return [];
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
