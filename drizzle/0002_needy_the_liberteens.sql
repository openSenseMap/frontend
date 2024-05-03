-- Custom SQL migration file, put you code below! --

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Turn the measurement table into a hypertable
SELECT create_hypertable('measurement', 'time');

-- Continuous aggregate (CAGG) of the hypertable
CREATE MATERIALIZED VIEW measurement_15min WITH (timescaledb.continuous) AS
SELECT measurement."sensorId",
       time_bucket('15 min', measurement.time) AS time,
       AVG(measurement.value) AS value_avg
FROM measurement
GROUP BY 1, 2
WITH NO DATA;

-- Add a CAGG policy in order to refresh it automatically
SELECT add_continuous_aggregate_policy('measurement_15min', start_offset => INTERVAL '1 day', end_offset => INTERVAL '1 hour', schedule_interval => INTERVAL '15 min');

-- Continuous aggregate (CAGG) on top of another CAGG / Hierarchical Continuous Aggregates , new in Timescale 2.9, issue with TZ as of https://github.com/timescale/timescaledb/pull/5195
CREATE MATERIALIZED VIEW measurement_1day WITH (timescaledb.continuous) AS
SELECT "sensorId",
       time_bucket('1 day', time) AS time,
       AVG(value_avg) AS value_avg
FROM measurement_15min
GROUP BY 1, 2
WITH NO DATA;

-- Add a CAGG policy in order to refresh it automatically
SELECT add_continuous_aggregate_policy('measurement_1day', start_offset => INTERVAL '3 days', end_offset => INTERVAL '1 day', schedule_interval => INTERVAL '15 min');

