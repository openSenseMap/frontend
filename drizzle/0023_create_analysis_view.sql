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

-- Create a materialized view that flattens measurements with device, location, and sensor data
-- This view provides a denormalized structure for data analysis
-- 
-- Structure:
-- - createdAt: measurement timestamp
-- - boxId: device ID
-- - tags: device tags array
-- - geometry: location point (SRID 4326) - uses the location from measurement if available
-- - measurements: JSONB object containing all sensor measurements
--   Each sensor is a key with value, unit, and sensor_id metadata
--
-- Note: Groups measurements by time and device. If multiple locations exist for the same
-- time/device, uses the location from the first measurement with a location.
-- Only includes measurements that have NOT been processed (not in processed_measurements table).
DROP VIEW IF EXISTS analysis_view;
DROP MATERIALIZED VIEW IF EXISTS analysis_view;
CREATE MATERIALIZED VIEW analysis_view AS
WITH grouped_measurements AS (
    SELECT 
        m.time,
        d.id AS device_id,
        d.tags,
        MAX(m.location_id) AS location_id,
        -- JSONB object for all sensor measurements
        -- Key: sensor_wiki_phenomenon or sensor_type or title or sensor_id
        -- Value: object with value, unit, and sensor_id
        COALESCE(
            jsonb_object_agg(
                COALESCE(
                    NULLIF(s.sensor_wiki_phenomenon, ''),
                    NULLIF(s.sensor_type, ''),
                    NULLIF(s.title, ''),
                    s.id::text
                ),
                jsonb_build_object(
                    'value', m.value,
                    'unit', COALESCE(s.unit, ''),
                    'sensor_id', s.id
                )
            ),
            '{}'::jsonb
        ) AS measurements
    FROM measurement m
    INNER JOIN sensor s ON m.sensor_id = s.id
    INNER JOIN device d ON s.device_id = d.id
    GROUP BY 
        m.time,
        d.id,
        d.tags
)
SELECT 
    gm.time AS "createdAt",
    gm.device_id AS "boxId",
    gm.tags,
    l.location::geometry(Point, 4326) AS geometry,
    gm.measurements
FROM grouped_measurements gm
LEFT JOIN location l ON gm.location_id = l.id
LEFT JOIN processed_measurements pm 
  ON gm.device_id = pm.device_id 
  AND gm.time = pm.time
WHERE pm.device_id IS NULL;  -- Only include unprocessed measurements

-- Add comment to help identify this view
COMMENT ON MATERIALIZED VIEW analysis_view IS 'Denormalized materialized view for data analysis combining measurements, devices, sensors, and locations. All sensor measurements are stored in a JSONB object with value, unit, and sensor_id metadata. Only includes unprocessed measurements.';

-- Create unique index on materialized view for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS analysis_view_created_at_boxid_unique 
  ON analysis_view("createdAt", "boxId");

-- Create indexes on the materialized view for better query performance
CREATE INDEX IF NOT EXISTS idx_analysis_view_created_at 
  ON analysis_view("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_view_boxid 
  ON analysis_view("boxId");
CREATE INDEX IF NOT EXISTS idx_analysis_view_geometry 
  ON analysis_view USING GIST(geometry) 
  WHERE geometry IS NOT NULL;

-- Initial population of the materialized view
REFRESH MATERIALIZED VIEW analysis_view;

-- Note: You may also want to add indexes on the underlying tables:
-- CREATE INDEX idx_measurement_time ON measurement(time);
-- CREATE INDEX idx_measurement_location_id ON measurement(location_id);
-- CREATE INDEX idx_sensor_device_id ON sensor(device_id);

