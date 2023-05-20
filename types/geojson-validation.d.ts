declare module "geojson-validation" {
  export function valid(geoJSONObject: unknown, trace?: boolean): boolean;
  export function isGeometryObject(
    geoJSONObject: unknown,
    trace: boolean
  ): boolean;
  export function isPoint(geoJSONObject: unknown, trace: boolean): boolean;
  export function isMultiPointCoor(
    geoJSONObject: unknown,
    trace: boolean
  ): boolean;
  export function isMultiPoint(geoJSONObject: unknown, trace: boolean): boolean;
  export function isLineStringCoor(
    geoJSONObject: unknown,
    trace: boolean
  ): boolean;
  export function isLineString(geoJSONObject: unknown, trace: boolean): boolean;
  export function isMultiLineStringCoor(
    geoJSONObject: unknown,
    trace: boolean
  ): boolean;
  export function isMultiLineString(
    geoJSONObject: unknown,
    trace: boolean
  ): boolean;
  export function isPolygonCoor(
    geoJSONObject: unknown,
    trace: boolean
  ): boolean;
  export function isPolygon(geoJSONObject: unknown, trace: boolean): boolean;
  export function isMultiPolygonCoor(
    geoJSONObject: unknown,
    trace: boolean
  ): boolean;
  export function isMultiPolygon(
    geoJSONObject: unknown,
    trace: boolean
  ): boolean;
  export function isGeometryCollection(
    geoJSONObject: unknown,
    trace: boolean
  ): boolean;
  export function isFeature(geoJSONObject: unknown, trace: boolean): boolean;
  export function isFeatureCollection(
    geoJSONObject: unknown,
    trace: boolean
  ): boolean;
  export function isBbox(geoJSONObject: unknown, trace: boolean): boolean;
}
