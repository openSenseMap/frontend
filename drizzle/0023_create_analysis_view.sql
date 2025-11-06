-- Create an analysis view that flattens measurements with device, location, and sensor data
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
CREATE OR REPLACE VIEW analysis_view AS
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
LEFT JOIN location l ON gm.location_id = l.id;

-- Add comment to help identify this view
COMMENT ON VIEW analysis_view IS 'Denormalized view for data analysis combining measurements, devices, sensors, and locations. All sensor measurements are stored in a JSONB object with value, unit, and sensor_id metadata.';

-- Create index on the view's key columns for better query performance
-- Note: You may want to add indexes on the underlying tables instead:
-- CREATE INDEX idx_measurement_time ON measurement(time);
-- CREATE INDEX idx_measurement_location_id ON measurement(location_id);
-- CREATE INDEX idx_sensor_device_id ON sensor(device_id);

