-- Create a table to track processed/read measurements
-- This allows us to exclude read measurements from the view without deleting them
CREATE TABLE IF NOT EXISTS processed_measurements (
  device_id TEXT NOT NULL,
  time TIMESTAMP WITH TIME ZONE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  PRIMARY KEY (device_id, time)
);

CREATE INDEX IF NOT EXISTS idx_processed_measurements_device_time 
  ON processed_measurements(device_id, time);

-- Create a view that flattens measurements with device, location, and sensor data
-- This view provides a denormalized structure for data analysis
-- Note: Regular view (not materialized) so it automatically reflects new data
-- 
-- Structure:
-- - `createdAt`: measurement timestamp
-- - `boxId`: device ID
-- - `tags`: device tags array
-- - `geometry`: location point (SRID 4326) if available
-- Derived columns for common phenomena (temperature, humidity, soil_moisture, pressure, pm values, wind_speed, light_intensity, UV, sound levels, VOC, CO₂) used by Martin tiles
--
-- Note: Groups measurements by time and device. If multiple locations exist for the same
-- time/device, uses the location from the first measurement with a location.
-- Only includes measurements that have NOT been processed (not in processed_measurements table).
DROP VIEW IF EXISTS analysis_view;
DROP MATERIALIZED VIEW IF EXISTS analysis_view;
CREATE VIEW analysis_view AS
WITH sensor_measurements AS (
    SELECT
        m.time,
        d.id AS device_id,
        d.tags,
        m.location_id,
        s.id AS sensor_id,
        s.title,
        s.unit,
        s.sensor_type,
        m.value,
        (
            CASE
                WHEN LOWER(COALESCE(s.unit, '')) IN ('°c', 'c°', 'degc', 'celsius')
                     AND LOWER(COALESCE(s.title, '')) LIKE '%boden%' THEN 'soil_temperature'
                WHEN LOWER(COALESCE(s.unit, '')) IN ('°c', 'c°', 'degc', 'celsius') THEN 'temperature'
                WHEN LOWER(COALESCE(s.unit, '')) IN ('%', 'percent', 'prozent')
                     AND LOWER(COALESCE(s.title, '')) LIKE '%boden%' THEN 'soil_moisture'
                WHEN LOWER(COALESCE(s.unit, '')) IN ('%', 'percent', 'prozent') THEN 'humidity'
                WHEN (LOWER(COALESCE(s.unit, '')) LIKE '%µg/m%'
                      OR LOWER(COALESCE(s.unit, '')) LIKE '%ug/m%') THEN
                    CASE
                        WHEN LOWER(COALESCE(s.title, '')) LIKE '%pm1%'
                             OR LOWER(COALESCE(s.title, '')) LIKE '%pm01%' THEN 'pm1'
                        WHEN LOWER(COALESCE(s.title, '')) LIKE '%pm2.5%'
                             OR LOWER(COALESCE(s.title, '')) LIKE '%pm2,5%'
                             OR LOWER(COALESCE(s.title, '')) LIKE '%pm25%' THEN 'pm2_5'
                        WHEN LOWER(COALESCE(s.title, '')) LIKE '%pm4%' THEN 'pm4'
                        WHEN LOWER(COALESCE(s.title, '')) LIKE '%pm10%' THEN 'pm10'
                        ELSE NULL
                    END
                WHEN LOWER(COALESCE(s.unit, '')) IN ('hpa', 'pa') THEN 'pressure'
                WHEN LOWER(COALESCE(s.unit, '')) LIKE '%m/s%' THEN 'wind_speed'
                WHEN LOWER(COALESCE(s.unit, '')) IN ('lx', 'lux') THEN 'light_intensity'
                WHEN LOWER(COALESCE(s.unit, '')) LIKE '%µw/cm%'
                     OR LOWER(COALESCE(s.unit, '')) LIKE '%uw/cm%' THEN 'uv_intensity'
                WHEN LOWER(COALESCE(s.unit, '')) = 'uv index' THEN 'uv_index'
                WHEN LOWER(COALESCE(s.unit, '')) LIKE '%db%' THEN
                    CASE
                        WHEN LOWER(COALESCE(s.title, '')) LIKE '%min%' THEN 'sound_level_min'
                        WHEN LOWER(COALESCE(s.title, '')) LIKE '%max%' THEN 'sound_level_max'
                        WHEN LOWER(COALESCE(s.title, '')) LIKE '%eq%'
                             OR LOWER(COALESCE(s.title, '')) LIKE '%schalldruckpegel%'
                             THEN 'sound_level_eq'
                        ELSE 'sound_level'
                    END
                WHEN LOWER(COALESCE(s.unit, '')) LIKE '%kohm%'
                     OR LOWER(COALESCE(s.unit, '')) LIKE '%kΩ%' THEN 'voc'
                WHEN LOWER(COALESCE(s.unit, '')) = 'ppm' THEN 'co2'
                ELSE NULL
            END
        ) AS canonical_key,
        COALESCE(
            CASE
                WHEN LOWER(COALESCE(s.unit, '')) IN ('°c', 'c°', 'degc', 'celsius')
                     AND LOWER(COALESCE(s.title, '')) LIKE '%boden%' THEN 'soil_temperature'
                WHEN LOWER(COALESCE(s.unit, '')) IN ('°c', 'c°', 'degc', 'celsius') THEN 'temperature'
                WHEN LOWER(COALESCE(s.unit, '')) IN ('%', 'percent', 'prozent')
                     AND LOWER(COALESCE(s.title, '')) LIKE '%boden%' THEN 'soil_moisture'
                WHEN LOWER(COALESCE(s.unit, '')) IN ('%', 'percent', 'prozent') THEN 'humidity'
                WHEN (LOWER(COALESCE(s.unit, '')) LIKE '%µg/m%'
                      OR LOWER(COALESCE(s.unit, '')) LIKE '%ug/m%') THEN
                    CASE
                        WHEN LOWER(COALESCE(s.title, '')) LIKE '%pm1%'
                             OR LOWER(COALESCE(s.title, '')) LIKE '%pm01%' THEN 'pm1'
                        WHEN LOWER(COALESCE(s.title, '')) LIKE '%pm2.5%'
                             OR LOWER(COALESCE(s.title, '')) LIKE '%pm2,5%'
                             OR LOWER(COALESCE(s.title, '')) LIKE '%pm25%' THEN 'pm2_5'
                        WHEN LOWER(COALESCE(s.title, '')) LIKE '%pm4%' THEN 'pm4'
                        WHEN LOWER(COALESCE(s.title, '')) LIKE '%pm10%' THEN 'pm10'
                        ELSE NULL
                    END
                WHEN LOWER(COALESCE(s.unit, '')) IN ('hpa', 'pa') THEN 'pressure'
                WHEN LOWER(COALESCE(s.unit, '')) LIKE '%m/s%' THEN 'wind_speed'
                WHEN LOWER(COALESCE(s.unit, '')) IN ('lx', 'lux') THEN 'light_intensity'
                WHEN LOWER(COALESCE(s.unit, '')) LIKE '%µw/cm%'
                     OR LOWER(COALESCE(s.unit, '')) LIKE '%uw/cm%' THEN 'uv_intensity'
                WHEN LOWER(COALESCE(s.unit, '')) = 'uv index' THEN 'uv_index'
                WHEN LOWER(COALESCE(s.unit, '')) LIKE '%db%' THEN
                    CASE
                        WHEN LOWER(COALESCE(s.title, '')) LIKE '%min%' THEN 'sound_level_min'
                        WHEN LOWER(COALESCE(s.title, '')) LIKE '%max%' THEN 'sound_level_max'
                        WHEN LOWER(COALESCE(s.title, '')) LIKE '%eq%'
                             OR LOWER(COALESCE(s.title, '')) LIKE '%schalldruckpegel%'
                             THEN 'sound_level_eq'
                        ELSE 'sound_level'
                    END
                WHEN LOWER(COALESCE(s.unit, '')) LIKE '%kohm%'
                     OR LOWER(COALESCE(s.unit, '')) LIKE '%kΩ%' THEN 'voc'
                WHEN LOWER(COALESCE(s.unit, '')) = 'ppm' THEN 'co2'
                ELSE NULL
            END,
            COALESCE(
                NULLIF(s.sensor_wiki_phenomenon, ''),
                NULLIF(s.sensor_type, ''),
                NULLIF(s.title, ''),
                s.id::text
            )
        ) AS json_key
    FROM measurement m
    INNER JOIN sensor s ON m.sensor_id = s.id
    INNER JOIN device d ON s.device_id = d.id
),
grouped_measurements AS (
    SELECT 
        sm.time,
        sm.device_id,
        sm.tags,
        MAX(sm.location_id) AS location_id,
        MAX(sm.value) FILTER (WHERE sm.canonical_key = 'temperature') AS temperature,
        MAX(sm.value) FILTER (WHERE sm.canonical_key = 'soil_temperature') AS soil_temperature,
        MAX(sm.value) FILTER (WHERE sm.canonical_key = 'humidity') AS humidity,
        MAX(sm.value) FILTER (WHERE sm.canonical_key = 'soil_moisture') AS soil_moisture,
        MAX(sm.value) FILTER (WHERE sm.canonical_key = 'pressure') AS pressure,
        MAX(sm.value) FILTER (WHERE sm.canonical_key = 'pm1') AS pm1,
        MAX(sm.value) FILTER (WHERE sm.canonical_key = 'pm2_5') AS pm2_5,
        MAX(sm.value) FILTER (WHERE sm.canonical_key = 'pm4') AS pm4,
        MAX(sm.value) FILTER (WHERE sm.canonical_key = 'pm10') AS pm10,
        MAX(sm.value) FILTER (WHERE sm.canonical_key = 'wind_speed') AS wind_speed,
        MAX(sm.value) FILTER (WHERE sm.canonical_key = 'light_intensity') AS light_intensity,
        MAX(sm.value) FILTER (WHERE sm.canonical_key = 'uv_intensity') AS uv_intensity,
        MAX(sm.value) FILTER (WHERE sm.canonical_key = 'uv_index') AS uv_index,
        MAX(sm.value) FILTER (WHERE sm.canonical_key = 'sound_level') AS sound_level,
        MAX(sm.value) FILTER (WHERE sm.canonical_key = 'sound_level_eq') AS sound_level_eq,
        MAX(sm.value) FILTER (WHERE sm.canonical_key = 'sound_level_min') AS sound_level_min,
        MAX(sm.value) FILTER (WHERE sm.canonical_key = 'sound_level_max') AS sound_level_max,
        MAX(sm.value) FILTER (WHERE sm.canonical_key = 'voc') AS voc,
        MAX(sm.value) FILTER (WHERE sm.canonical_key = 'co2') AS co2
    FROM sensor_measurements sm
    GROUP BY sm.time, sm.device_id, sm.tags
)
SELECT 
    gm.time AS "createdAt",
    gm.device_id AS "boxId",
    gm.tags,
    l.location::geometry(Point, 4326) AS geometry,
    gm.temperature,
    gm.soil_temperature,
    gm.humidity,
    gm.soil_moisture,
    gm.pressure,
    gm.pm1,
    gm.pm2_5,
    gm.pm4,
    gm.pm10,
    gm.wind_speed,
    gm.light_intensity,
    gm.uv_intensity,
    gm.uv_index,
    gm.sound_level,
    gm.sound_level_eq,
    gm.sound_level_min,
    gm.sound_level_max,
    gm.voc,
    gm.co2
FROM grouped_measurements gm
LEFT JOIN location l ON gm.location_id = l.id
LEFT JOIN processed_measurements pm 
  ON gm.device_id = pm.device_id 
  AND gm.time = pm.time
WHERE pm.device_id IS NULL;  -- Only include unprocessed measurements

-- Add comment to help identify this view
COMMENT ON VIEW analysis_view IS 'Denormalized view for data analysis combining measurements, devices, sensors, and locations. Derived columns expose common phenomena for vector tiles and API consumption. Only includes unprocessed measurements. Automatically reflects new data.';

-- Note: You may also want to add indexes on the underlying tables:
-- CREATE INDEX idx_measurement_time ON measurement(time);
-- CREATE INDEX idx_measurement_location_id ON measurement(location_id);
-- CREATE INDEX idx_sensor_device_id ON sensor(device_id);

