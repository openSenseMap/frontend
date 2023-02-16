export function getEnv() {
  return {
    MAPTILER_KEY: process.env.MAPTILER_KEY,
  };
}

type ENV = ReturnType<typeof getEnv>;

declare global {
  var ENV: ENV;
  interface Window {
    ENV: ENV;
  }
}
