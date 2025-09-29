export function transformDeviceToApiFormat(box: any, jwtString: string) {
  const { id, tags, sensors, ...rest } = box;
  const timestamp = box.updatedAt.toISOString();
  const coordinates = [box.longitude, box.latitude];
  
  return {
    _id: id,
    grouptag: tags || [],
    access_token: jwtString,
    ...rest,
    currentLocation: {
      type: "Point",
      coordinates,
      timestamp
    },
    lastMeasurementAt: timestamp,
    loc: [{
      geometry: { type: "Point", coordinates, timestamp },
      type: "Feature"
    }],
    integrations: { mqtt: { enabled: false } },
    sensors: sensors?.map((sensor: any) => ({
      _id: sensor.id,
      title: sensor.title,
      unit: sensor.unit,
      sensorType: sensor.sensorType,
      lastMeasurement: sensor.lastMeasurement,
    })) || [],
  };
}
