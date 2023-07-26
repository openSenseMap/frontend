-- Add a retention policy to our Measurement hypertable
-- We just want to keep raw measurement data for 2 years
SELECT add_retention_policy('"Measurement"', INTERVAL '2 years');