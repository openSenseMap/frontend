export function getEnv() {
  return {
    MAPBOX_GEOCODING_API: process.env.MAPBOX_GEOCODING_API,
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
    DIRECTUS_URL: process.env.DIRECTUS_URL,
    MYBADGES_API_URL: process.env.MYBADGES_API_URL,
    MYBADGES_URL: process.env.MYBADGES_URL,
    NOVU_API_URL: process.env.NOVU_API_URL,
    NOVU_WEBSOCKET_URL: process.env.NOVU_WEBSOCKET_URL,
    NOVU_APPLICATION_IDENTIFIER: process.env.NOVU_APPLICATION_IDENTIFIER,
  };
}

type ENV = ReturnType<typeof getEnv>;

declare global {
  var ENV: ENV;
  interface Window {
    ENV: ENV;
  }
}
