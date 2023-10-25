import { useMatches } from "@remix-run/react";
import type { User } from "db/schema";
import { useMemo } from "react";

const DEFAULT_REDIRECT = "/";

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
 * This function  is called when the user make a change on filter tab. It reaturns list of devices based on user selected filters.

 * @param devices all devices data
 * @param filterParams attributes and selected values
 */
export function getFilteredDevices(
  devices: any,
  filterParams: URLSearchParams,
) {
  // if a param is missing/undefined set it as ALL
  const {
    exposure = "ALL",
    status = "ALL",
    phenomenon = "ALL",
  } = Object.fromEntries(filterParams.entries());

  let results: any = [];

  if (exposure === "ALL" && status === "ALL" && phenomenon === "ALL") {
    return devices;
  } else {
    for (let index = 0; index < devices.features.length; index++) {
      const device = devices.features[index];
      //* extract list of sensors titles
      const sensorsList = device.properties.sensors.map((s: any) => {
        return s.title;
      });

      if (
        (exposure === "ALL" || exposure === device.properties.exposure) &&
        (status === "ALL" || status === device.properties.status) &&
        (phenomenon === "ALL" || sensorsList.includes(phenomenon))
      ) {
        results.push(device);
      }

      if (index === devices.features.length - 1) {
        return {
          type: "FeatureCollection",
          features: results,
        };
      }
    }
  }
}
