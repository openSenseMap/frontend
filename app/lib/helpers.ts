export const hasObjPropMatchWithPrefixKey = (
  object: Object,
  prefixes: string[]
) => {
  const keys = Object.keys(object);
  for (const key of keys) {
    for (const prefix of prefixes) {
      if (key.startsWith(prefix)) {
        return true;
      }
    }
  }
  return false;
};

export const exposureHelper = (exposure: string) => {
  switch (exposure) {
    case "mobile":
      return "MOBILE";
    case "outdoor":
      return "OUTDOOR";
    case "indoor":
      return "INDOOR";
    default:
      return "UNKNOWN";
  }
};

/**
 * Parses request data from either JSON or form data format.
 * Automatically detects the content type and parses accordingly.
 * Provides backward compatibility for old devices that send JSON while
 * supporting new devices that send form data.
 * 
 * @param request - The incoming request
 * @returns Parsed data object
 * @throws Error if parsing fails
 */
export async function parseRequestData(request: Request): Promise<Record<string, any>> {
  const contentType = request.headers.get('content-type') || '';
  
  // Parse JSON only if content-type is application/json
  if (contentType.includes('application/json')) {
    try {
      return await request.json();
    } catch (error) {
      throw new Error(`Failed to parse JSON data: ${error}`);
    }
  }
  
  // For all other cases (including application/x-www-form-urlencoded and multipart/form-data), parse as form data
  try {
    const formData = await request.formData();
    return Object.fromEntries(formData);
  } catch (error) {
    throw new Error(`Failed to parse form data: ${error}`);
  }
}

/**
 * Convenience function to parse user registration data with field mapping.
 * Handles both JSON and form data formats with backward compatibility.
 * 
 * @param request - The incoming request
 * @returns Parsed registration data with mapped field names
 */
export async function parseUserRegistrationData(request: Request): Promise<{
  name: string;
  email: string;
  password: string;
  language: string;
}> {
  const data = await parseRequestData(request);
  
  return {
    name: data.name || "",
    email: data.email || "",
    password: data.password || "",
    language: data.language || "en_US"
  };
}

/**
 * Convenience function to parse user sign-in data.
 * Handles both JSON and form data formats.
 * 
 * @param request - The incoming request
 * @returns Parsed sign-in data
 */
export async function parseUserSignInData(request: Request): Promise<{
  email: string;
  password: string;
}> {
  const data = await parseRequestData(request);
  
  return {
    email: data.email,
    password: data.password
  };
}
