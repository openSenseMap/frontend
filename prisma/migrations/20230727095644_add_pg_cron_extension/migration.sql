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

-- Call stored procedure to update sensor status every 5 minutes
SELECT cron.schedule('sensor-update-status', '*/5 * * * *', 'CALL update_sensor_status()');

-- Stored procedure to set Device status
CREATE OR REPLACE PROCEDURE update_device_status()
LANGUAGE SQL
AS $$
	UPDATE "Device" SET status='OLD'
	WHERE EXISTS (
		SELECT * FROM "Sensor" WHERE "Device".id="Sensor"."deviceId" AND status='OLD'
	);

	UPDATE "Device" SET status='INACTIVE'
	WHERE EXISTS (
		SELECT * FROM "Sensor" WHERE "Device".id="Sensor"."deviceId" AND status='INACTIVE'
	);

	UPDATE "Device" SET status='ACTIVE'
	WHERE EXISTS (
		SELECT * FROM "Sensor" WHERE "Device".id="Sensor"."deviceId" AND status='ACTIVE'
	);
$$;

-- Call stored procedure to update device status every 7 minutes
SELECT cron.schedule('device-update-status', '*/7 * * * *', 'CALL update_device_status()');