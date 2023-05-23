export function getEnv() {
  return {
    MAPBOX_GEOCODING_API: process.env.MAPBOX_GEOCODING_API,
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
    DIRECTUS_URL: process.env.DIRECTUS_URL,
  };
}

type ENV = ReturnType<typeof getEnv>;

declare global {
  var ENV: ENV;
  interface Window {
    ENV: ENV;
  }
}
