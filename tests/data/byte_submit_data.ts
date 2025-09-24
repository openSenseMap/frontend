/**
 * Encoding format (per sensor):
 * - 12 bytes: sensorId (hex string, truncated/padded)
 * - 4 bytes: float32 measurement value
 * - [optional] 4 bytes: uint32 timestamp (UNIX seconds, big endian)
 */

export function byteSubmitData(
    sensors: { id: string }[],
    withTimestamps = false
  ): Uint8Array {
    const bytesPerSensor = withTimestamps ? 20 : 16;
    const buffer = new ArrayBuffer(sensors.length * bytesPerSensor);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
  
    sensors.forEach((sensor, i) => {
      const offset = i * bytesPerSensor;
  
      const idHex = sensor.id.replace(/^0x/, "");
      for (let j = 0; j < 12; j++) {
        const hexByte = idHex.slice(j * 2, j * 2 + 2);
        bytes[offset + j] = hexByte ? parseInt(hexByte, 16) : 0;
      }
  
      view.setFloat32(offset + 12, i, true);
  
      if (withTimestamps) {
        const timestampSeconds = Math.floor((Date.now() - i * 60_000) / 1000);
        view.setUint32(offset + 16, timestampSeconds, true);
      }
    });
  
    return bytes;
  }
  