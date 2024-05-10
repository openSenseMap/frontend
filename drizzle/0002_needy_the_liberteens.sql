-- Custom SQL migration file, put you code below! --

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Turn the measurement table into a hypertable
SELECT create_hypertable('measurement', 'time');

-- For setting up downsampling and data retention check the Timescale visualizer and code generator
-- https://docs.timescale.com/use-timescale/latest/continuous-aggregates/drop-data/#set-up-downsampling-and-data-retention

-- Add retention policy for raw data (Drop raw data older than 1 year)
SELECT add_retention_policy('measurement', INTERVAL '1 year');

-- Continuous aggregate (CAGG) of the hypertable
CREATE MATERIALIZED VIEW measurement_15min WITH (timescaledb.continuous) AS
SELECT measurement."sensorId",
       time_bucket('15 min', measurement.time) AS time,
       AVG(measurement.value) AS value_avg
FROM measurement
GROUP BY 1, 2
WITH NO DATA;

-- Add a CAGG policy in order to refresh it automatically
-- Refresh: Automatically keep downsampled data up to date with new data from 30 minutes to 1 week ago.
SELECT add_continuous_aggregate_policy('measurement_15min', start_offset => INTERVAL '1 week', end_offset => INTERVAL '1 hour', schedule_interval => INTERVAL '15 minutes');

-- We do not activate dropping downsampled data for now
-- Drop downsampled data: Drop downsampled data older than 5 years
-- SELECT add_retention_policy('measurement_15min', INTERVAL '5 years');

-- Continuous aggregate (CAGG) on top of another CAGG / Hierarchical Continuous Aggregates , new in Timescale 2.9, issue with TZ as of https://github.com/timescale/timescaledb/pull/5195
CREATE MATERIALIZED VIEW measurement_1day WITH (timescaledb.continuous) AS
SELECT "sensorId",
       time_bucket('1 day', time) AS time,
       AVG(value_avg) AS value_avg
FROM measurement_15min
GROUP BY 1, 2
WITH NO DATA;

-- Add a CAGG policy in order to refresh it automatically
SELECT add_continuous_aggregate_policy('measurement_1day', start_offset => INTERVAL '1 week', end_offset => INTERVAL '2 days', schedule_interval => INTERVAL '1 day');

-- We do not activate dropping downsampled data for now
-- Drop downsampled data: Drop downsampled data older than 5 years
-- SELECT add_retention_policy('measurement_1day', INTERVAL '5 years');