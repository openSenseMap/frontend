const decodeHandlers: { [key: string]: { decodeMessage: (data: any, options: any) => any[] } } = {
    'application/json': {
      decodeMessage: (body: any, { sensors }: { sensors: any[] }) => {
        if (Array.isArray(body)) {
          // JSON Array format
          return body.map(measurement => ({
            sensor_id: measurement.sensor,
            value: parseFloat(measurement.value),
            createdAt: measurement.createdAt ? new Date(measurement.createdAt) : new Date(),
            location: measurement.location || null,
          }));
        } else {
          // JSON Object format
          return Object.entries(body).map(([sensorId, value]: [string, any]) => {
            let measurementValue, createdAt, location;
            
            if (Array.isArray(value)) {
              measurementValue = parseFloat(value[0]);
              createdAt = value[1] ? new Date(value[1]) : new Date();
              location = value[2] || null;
            } else {
              measurementValue = parseFloat(value);
              createdAt = new Date();
              location = null;
            }
  
            return {
              sensor_id: sensorId,
              value: measurementValue,
              createdAt,
              location,
            };
          });
        }
      }
    },
  
    'text/csv': {
      decodeMessage: (body: string, { sensors }: { sensors: any[] }) => {
        const lines = body.trim().split('\n');
        return lines.map(line => {
          const parts = line.split(',').map(part => part.trim());
          const sensorId = parts[0];
          const value = parseFloat(parts[1]);
          const createdAt = parts[2] ? new Date(parts[2]) : new Date();
          
          let location = null;
          if (parts[3] && parts[4]) {
            location = {
              longitude: parseFloat(parts[3]),
              latitude: parseFloat(parts[4]),
              height: parts[5] ? parseFloat(parts[5]) : undefined,
            };
          }
  
          return {
            sensor_id: sensorId,
            value,
            createdAt,
            location,
          };
        });
      }
    },
  
    'luftdaten': {
      decodeMessage: (body: any, { sensors }: { sensors: any[] }) => {
        const sensorMappings: { [key: string]: string } = {
          'SDS_P1': 'PM10',
          'SDS_P2': 'PM2.5',
        };
  
        return body.sensordatavalues.map((item: any) => {
          const mappedTitle = sensorMappings[item.value_type];
          const sensor = sensors.find(s => s.title === mappedTitle);
          
          if (!sensor) {
            throw new Error(`No sensor found for value_type: ${item.value_type}`);
          }
  
          return {
            sensor_id: sensor.id,
            value: parseFloat(item.value),
            createdAt: new Date(),
            location: null,
          };
        });
      }
    },
  
    'hackair': {
      decodeMessage: (body: any, { sensors }: { sensors: any[] }) => {
        const sensorMappings: { [key: string]: string } = {
          'PM2.5_AirPollutantValue': 'PM2.5',
          'PM10_AirPollutantValue': 'PM10',
        };
  
        return Object.entries(body.reading).map(([key, value]: [string, any]) => {
          const mappedTitle = sensorMappings[key];
          if (!mappedTitle) return null;
  
          const sensor = sensors.find(s => s.title === mappedTitle);
          if (!sensor) {
            throw new Error(`No sensor found for sensor_description: ${key}`);
          }
  
          return {
            sensor_id: sensor.id,
            value: parseFloat(value),
            createdAt: new Date(),
            location: null,
          };
        }).filter(Boolean);
      }
    },
  
    'application/sbx-bytes': {
  decodeMessage: (body: ArrayBuffer, { sensors }: { sensors: any[] }) => {
    const DATA_LENGTH_NO_TIMESTAMP = 16; // 12 bytes sensorId + 4 bytes float32
    const bytes = new Uint8Array(body);
    const measurements = [];

    if (bytes.length % DATA_LENGTH_NO_TIMESTAMP !== 0) {
      throw new Error('Invalid data length for sbx-bytes format');
    }

    const measurementCount = bytes.length / DATA_LENGTH_NO_TIMESTAMP;
    if (measurementCount > 2500) {
      throw new Error('Too many measurements. Please submit at most 2500 measurements at once.');
    }

    if (measurementCount === 0) {
      throw new Error('Cannot save empty measurements.');
    }

    for (let first = 0; first < bytes.length; first += DATA_LENGTH_NO_TIMESTAMP) {
      const measurement = extractMeasurement(bytes, first, sensors, false);
      if (measurement) {
        measurements.push(measurement);
      }
    }

    return measurements;
  }
},

'application/sbx-bytes-ts': {
  decodeMessage: (body: ArrayBuffer, { sensors }: { sensors: any[] }) => {
    const DATA_LENGTH_WITH_TIMESTAMP = 20; // 12 bytes sensorId + 4 bytes float32 + 4 bytes timestamp
    const bytes = new Uint8Array(body);
    const measurements = [];

    if (bytes.length % DATA_LENGTH_WITH_TIMESTAMP !== 0) {
      throw new Error('Invalid data length for sbx-bytes-ts format');
    }

    const measurementCount = bytes.length / DATA_LENGTH_WITH_TIMESTAMP;
    if (measurementCount > 2500) {
      throw new Error('Too many measurements. Please submit at most 2500 measurements at once.');
    }

    if (measurementCount === 0) {
      throw new Error('Cannot save empty measurements.');
    }

    for (let first = 0; first < bytes.length; first += DATA_LENGTH_WITH_TIMESTAMP) {
      const measurement = extractMeasurement(bytes, first, sensors, true);
      if (measurement) {
        measurements.push(measurement);
      }
    }

    return measurements;
  }
}
  };

  export function hasDecoder(contentType: string): boolean {
    return Object.prototype.hasOwnProperty.call(decodeHandlers, contentType) || 
           contentType.includes('application/json') || 
           contentType.includes('text/csv') || 
           contentType.includes('application/sbx-bytes') || 
           contentType.includes('text/plain;charset=UTF-8'); // TODO: implement
  }
  
  export async function decodeMeasurements(
    measurements: any,
    options: { contentType: string; sensors: any[] }
  ): Promise<any[]> {
    try {
      return decodeHandlers[options.contentType].decodeMessage(measurements, { sensors: options.sensors });
    } catch (err: any) {
      const error = new Error(err.message);
      error.name = "ModelError";
      (error as any).type = "UnprocessableEntityError";
      throw error;
    }
  }

  function extractMeasurement(
    bytes: Uint8Array, 
    offset: number, 
    sensors: any[], 
    withTimestamp: boolean
  ): any | null {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset);
  
    // Extract sensor ID (first 12 bytes as hex string)
    const sensorIdBytes = bytes.slice(offset, offset + 12);
    const sensorIdHex = Array.from(sensorIdBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .replace(/0+$/, ''); // Remove trailing zeros
  
    // Convert hex back to sensor ID format (this might need adjustment based on your ID format)
    let sensorId = sensorIdHex;
    
    // Try to find matching sensor by ID
    const matchingSensor = sensors.find(s => {
      const cleanId = s.id.replace(/^0x/, '').toLowerCase();
      return cleanId.startsWith(sensorIdHex.toLowerCase()) || 
             sensorIdHex.toLowerCase().startsWith(cleanId);
    });
  
    if (!matchingSensor) {
      // If we can't find a matching sensor, skip this measurement
      console.warn(`No matching sensor found for hex ID: ${sensorIdHex}`);
      return null;
    }
  
    sensorId = matchingSensor.id;
  
    // Extract value (4 bytes float32, little endian)
    const value = view.getFloat32(12, true);
  
    // Extract timestamp if present
    let createdAt = new Date();
    if (withTimestamp) {
      const timestampSeconds = view.getUint32(16, true);
      createdAt = new Date(timestampSeconds * 1000);
      
      // Validate timestamp is not too far in the future
      const now = new Date();
      const maxFutureTime = 5 * 60 * 1000; // 5 minutes
      if (createdAt.getTime() > now.getTime() + maxFutureTime) {
        throw new Error(`Timestamp ${createdAt.toISOString()} is too far into the future.`);
      }
    }
  
    return {
      sensor_id: sensorId,
      value: value,
      createdAt: createdAt,
      location: null,
    };
  }