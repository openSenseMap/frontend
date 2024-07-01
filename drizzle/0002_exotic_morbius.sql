-- Custom SQL migration file, put you code below! --

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Turn the measurement table into a hypertable
SELECT create_hypertable('measurement', 'time');

-- Drop raw data older than 1 year
SELECT add_retention_policy('measurement', INTERVAL '1 year');

-- Continuous aggregate (CAGG) of the hypertable
-- https://docs.timescale.com/use-timescale/latest/continuous-aggregates/real-time-aggregates/
CREATE MATERIALIZED VIEW measurement_15min WITH (timescaledb.continuous, timescaledb.materialized_only = false) AS
SELECT measurement.sensor_id,
       time_bucket('15 min', measurement.time) AS time,
       AVG(measurement.value) AS value_avg
FROM measurement
GROUP BY 1, 2
WITH NO DATA;

-- Add a CAGG policy in order to refresh it automatically
-- Automatically keep downsampled data up to date with new data from 20 minutes to 6 hours ago.
-- https://docs.timescale.com/use-timescale/latest/continuous-aggregates/drop-data/
SELECT add_continuous_aggregate_policy('measurement_15min',
  start_offset => INTERVAL '6 hours',
  end_offset => INTERVAL '20 minutes',
  schedule_interval => INTERVAL '15 minutes'
);

-- Continuous aggregate (CAGG) on top of another CAGG / Hierarchical Continuous Aggregates , new in Timescale 2.9, issue with TZ as of https://github.com/timescale/timescaledb/pull/5195
-- https://docs.timescale.com/use-timescale/latest/continuous-aggregates/real-time-aggregates/
CREATE MATERIALIZED VIEW measurement_1day WITH (timescaledb.continuous, timescaledb.materialized_only = false) AS
SELECT sensor_id,
       time_bucket('1 day', time) AS time,
       AVG(value_avg) AS value_avg
FROM measurement_15min
GROUP BY 1, 2
WITH NO DATA;

-- Add a CAGG policy in order to refresh it automatically
-- Automatically keep downsampled data up to date with new data from 2 days to 3 days ago.
-- https://docs.timescale.com/use-timescale/latest/continuous-aggregates/drop-data/
SELECT add_continuous_aggregate_policy('measurement_1day',
  start_offset => INTERVAL '3 days',
  end_offset => INTERVAL '2 days',
  schedule_interval => INTERVAL '1 day'
);

