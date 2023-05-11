-- Make the Measurement table a hypertable
SELECT create_hypertable('"Measurement"', 'time');