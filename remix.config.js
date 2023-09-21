/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  cacheDirectory: "./node_modules/.cache/remix",
  ignoredRouteFiles: ["**/.*", "**/*.css", "**/*.test.{js,jsx,ts,tsx}"],
  serverDependenciesToBundle: ["chartjs-adapter-date-fns", "maplibre-gl", "postgres"],
  future: {
    v2_errorBoundary: true,
    v2_routeConvention: true,
    v2_headers: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
  },
};
