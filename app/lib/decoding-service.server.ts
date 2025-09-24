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
        // Binary format handling would go here
        // This is more complex and would require proper binary parsing
        throw new Error('Binary format decoding not yet implemented');
      }
    },
  
    'application/sbx-bytes-ts': {
      decodeMessage: (body: ArrayBuffer, { sensors }: { sensors: any[] }) => {
        // Binary format with timestamp handling would go here
        throw new Error('Binary format with timestamp decoding not yet implemented');
      }
    }
  };

  export function hasDecoder(contentType: string): boolean {
    return Object.prototype.hasOwnProperty.call(decodeHandlers, contentType) || 
           contentType.includes('application/json') || 
           contentType.includes('text/csv') || 
           contentType.includes('application/sbx-bytes');
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