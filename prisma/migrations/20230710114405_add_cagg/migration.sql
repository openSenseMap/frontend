-- Continuous aggregate (CAGG) of the hypertable
CREATE MATERIALIZED VIEW measurements_15min WITH (timescaledb.continuous) AS
SELECT "Measurement"."sensorId",
       time_bucket('15 min', "Measurement".time) AS time,
       AVG(value) AS value
FROM "Measurement"
GROUP BY 1, 2
WITH NO DATA;

-- Add a CAGG policy in order to refresh it automatically
SELECT add_continuous_aggregate_policy('measurements_15min', start_offset => INTERVAL '1 day', end_offset => INTERVAL '1 hour', schedule_interval => INTERVAL '15 min');

-- Continuous aggregate (CAGG) on top of another CAGG / Hierarchical Continuous Aggregates , new in Timescale 2.9, issue with TZ as of https://github.com/timescale/timescaledb/pull/5195
CREATE MATERIALIZED VIEW measurements_1day WITH (timescaledb.continuous) AS
SELECT measurements_15min."sensorId",
       time_bucket('1 day', measurements_15min.time) AS time,
       AVG(value) AS value
FROM measurements_15min
GROUP BY 1, 2
WITH NO DATA;

-- Add a CAGG policy in order to refresh it automatically
SELECT add_continuous_aggregate_policy('measurements_1day', start_offset => INTERVAL '3 days', end_offset => INTERVAL '1 day', schedule_interval => INTERVAL '15 min');