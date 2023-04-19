export function getEnv() {
  return {
    MAPTILER_KEY: process.env.MAPTILER_KEY,
    DIRECTUS_URL: process.env.DIRECTUS_URL
  };
}

type ENV = ReturnType<typeof getEnv>;

declare global {
  var ENV: ENV;
  interface Window {
    ENV: ENV;
  }
}
