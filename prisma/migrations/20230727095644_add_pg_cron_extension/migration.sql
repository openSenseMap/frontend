-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Stored procedure to update Sensor status
CREATE OR REPLACE PROCEDURE update_sensor_status()
LANGUAGE SQL
AS $$
	UPDATE "Sensor"
	SET status = CASE
		WHEN (SELECT max(time) FROM "Measurement" WHERE "Sensor".id = "Measurement"."sensorId") > now() - interval '7 days' THEN 'ACTIVE'::"Status"
		WHEN (SELECT max(time) FROM "Measurement" WHERE "Sensor".id = "Measurement"."sensorId") > now() - interval '30 days' AND (SELECT max(time) FROM "Measurement" WHERE "Sensor".id = "Measurement"."sensorId") < now() - interval '8 days' THEN 'INACTIVE'::"Status"
		ELSE 'OLD'::"Status"
	END;
$$;

-- Call stored procedure every 5 minutes
SELECT cron.schedule('sensor-update-status', '*/5 * * * *', 'CALL update_sensor_status()');