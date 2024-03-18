/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  cacheDirectory: "./node_modules/.cache/remix",
  ignoredRouteFiles: ["**/.*", "**/*.css", "**/*.test.{js,jsx,ts,tsx}"],
  serverDependenciesToBundle: ["chartjs-adapter-date-fns", "maplibre-gl", "supercluster", "use-supercluster", "kdbush", "postgres"],
  serverModuleFormat: "cjs",
  browserNodeBuiltinsPolyfill: { modules: { events: true } }
};
