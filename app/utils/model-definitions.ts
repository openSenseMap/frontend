import { sensorDefinitions } from "./sensor-definitions";

// Models Definition
export const modelDefinitions = {
  senseBoxHomeV2: [
    sensorDefinitions.hdc1080_temperature,
    sensorDefinitions.hdc1080_humidity,
    sensorDefinitions.bmp280_pressure,
    sensorDefinitions.tsl45315_lightintensity,
    sensorDefinitions.veml6070_uvintensity,
    sensorDefinitions.sds011_pm10,
    sensorDefinitions.sds011_pm25,
    sensorDefinitions.bme680_humidity,
    sensorDefinitions.bme680_temperature,
    sensorDefinitions.bme680_pressure,
    sensorDefinitions.bme680_voc,
    sensorDefinitions.smt50_soilmoisture,
    sensorDefinitions.smt50_soiltemperature,
    sensorDefinitions.soundlevelmeter,
    sensorDefinitions.windspeed,
    sensorDefinitions.scd30_co2,
    sensorDefinitions.dps310_pressure,
    sensorDefinitions.sps30_pm1,
    sensorDefinitions.sps30_pm4,
    sensorDefinitions.sps30_pm10,
    sensorDefinitions.sps30_pm25,
  ],
  "senseBox:Edu": [
    sensorDefinitions.hdc1080_temperature,
    sensorDefinitions.hdc1080_humidity,
    sensorDefinitions.bmp280_pressure,
    sensorDefinitions.tsl45315_lightintensity,
    sensorDefinitions.veml6070_uvintensity,
    sensorDefinitions.sds011_pm10,
    sensorDefinitions.sds011_pm25,
    sensorDefinitions.bme680_humidity,
    sensorDefinitions.bme680_temperature,
    sensorDefinitions.bme680_pressure,
    sensorDefinitions.bme680_voc,
    sensorDefinitions.smt50_soilmoisture,
    sensorDefinitions.smt50_soiltemperature,
    sensorDefinitions.soundlevelmeter,
    sensorDefinitions.windspeed,
    sensorDefinitions.scd30_co2,
    sensorDefinitions.dps310_pressure,
    sensorDefinitions.sps30_pm1,
    sensorDefinitions.sps30_pm4,
    sensorDefinitions.sps30_pm10,
    sensorDefinitions.sps30_pm25,
  ],
  "luftdaten.info": [
    sensorDefinitions.pms1003_pm01,
    sensorDefinitions.pms1003_pm10,
    sensorDefinitions.pms1003_pm25,
    sensorDefinitions.pms3003_pm01,
    sensorDefinitions.pms3003_pm10,
    sensorDefinitions.pms3003_pm25,
    sensorDefinitions.pms5003_pm01,
    sensorDefinitions.pms5003_pm10,
    sensorDefinitions.pms5003_pm25,
    sensorDefinitions.pms7003_pm01,
    sensorDefinitions.pms7003_pm10,
    sensorDefinitions.pms7003_pm25,
    sensorDefinitions.sds011_pm10,
    sensorDefinitions.sds011_pm25,
    sensorDefinitions.sps30_pm1,
    sensorDefinitions.sps30_pm4,
    sensorDefinitions.sps30_pm10,
    sensorDefinitions.sps30_pm25,
    sensorDefinitions.sht3x_humidity,
    sensorDefinitions.sht3x_temperature,
    sensorDefinitions.bmp180_temperature,
    sensorDefinitions.bmp180_pressure_pa,
    sensorDefinitions.bmp180_pressure_hpa,
    sensorDefinitions.bme280_humidity,
    sensorDefinitions.bme280_temperature,
    sensorDefinitions.bme280_pressure_pa,
    sensorDefinitions.bme280_pressure_hpa,
    sensorDefinitions.dht11_humidity,
    sensorDefinitions.dht11_temperature,
    sensorDefinitions.dht22_humidity,
    sensorDefinitions.dht22_temperature,
  ],
  // if custom, return all sensors
  Custom: Object.values(sensorDefinitions),
};

// Exporting models
export const getSensorsForModel = (model: keyof typeof modelDefinitions) => {
  return modelDefinitions[model] || null;
};
