CREATE TABLE "sensor_wiki_alias" (
	"id" text PRIMARY KEY NOT NULL,
	"sensor_wiki_phenomenon" text NOT NULL,
	"sensor_wiki_unit" text,
	"title" text NOT NULL,
	"unit" text,
	"title_aliases" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"unit_aliases" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"sensor_type_aliases" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	CONSTRAINT "sensor_wiki_alias_phenomenon_unit_unique" UNIQUE NULLS NOT DISTINCT("sensor_wiki_phenomenon","sensor_wiki_unit")
);
--> statement-breakpoint
CREATE INDEX "sensor_wiki_alias_phenomenon_idx" ON "sensor_wiki_alias" USING btree ("sensor_wiki_phenomenon");--> statement-breakpoint
INSERT INTO "sensor_wiki_alias" ("id", "sensor_wiki_phenomenon", "sensor_wiki_unit", "title", "unit", "title_aliases", "unit_aliases", "sensor_type_aliases") VALUES
	('znwgs072ij4y9ejzqgvm75kf', 'temperature', 'Cel', 'Temperature', '°C', ARRAY['air temperature', 'bodentemperatur', 'bodentemperatur 10cm', 'bodentemperatur 30cm', 'bodentemperatur_1', 'bodentemperatur_2', 'lufttemperatur', 'temperatur', 'temperatur bme280', 'temperatur dht22', 'temperatur heca', 'temperatur scd30', 'temperatura', 'temperature', 'temperature bme280', 'temperature dht22', 'temperature heca', 'temperature scd30', 'temp']::text[], ARRAY['c', 'cel', 'celsius', 'degc', 'degree celsius', '°c']::text[], ARRAY[]::text[]),
	('uzh4dswo2gy2oit7ke9igy8b', 'relative_humidity', '%', 'Relative humidity', '%', ARRAY['humidity', 'luftfeuchte', 'luftfeuchtigkeit', 'rel luftfeuchte', 'rel luftfeuchte bme280', 'rel luftfeuchte dht22', 'rel luftfeuchte heca', 'rel luftfeuchte scd30', 'rel. luftfeuchte', 'rel. luftfeuchte bme280', 'rel. luftfeuchte dht22', 'rel. luftfeuchte heca', 'rel. luftfeuchte scd30', 'rel luftfeuchtigkeit', 'rel. luftfeuchtigkeit', 'relative humidity']::text[], ARRAY['%', '%rh', 'percent', 'rh']::text[], ARRAY[]::text[]),
	('gra9bwt3ahtsf4gxkwl18dla', 'barometric_pressure', 'hPa', 'Barometric pressure', 'hPa', ARRAY['air pressure', 'atm luftdruck', 'atm. luftdruck', 'barametric pressure', 'barometric pressure', 'luftdruck absolut', 'luftdruck bme280', 'luftdruck bmp', 'luftdruck relativ', 'luftdruck', 'presion atmosferica', 'presión atmosferica', 'pressure']::text[], ARRAY['hpa', 'inhg', 'mbar']::text[], ARRAY[]::text[]),
	('iqcq4ikpbug3sld5vw25lchf', 'barometric_pressure', 'Pa', 'Barometric pressure', 'Pa', ARRAY['air pressure', 'atm luftdruck', 'atm. luftdruck', 'barametric pressure', 'barometric pressure', 'luftdruck bme280', 'luftdruck bmp', 'luftdruck', 'presion atmosferica', 'presión atmosferica', 'pressure']::text[], ARRAY['pa']::text[], ARRAY[]::text[]),
	('c15cs38xnqap59qfzw5nag0y', 'pm10', 'ug/m3', 'PM10', 'µg/m³', ARRAY['feinstaub pm10', 'particle 10', 'particulate matter 10', 'pm 10', 'pm10']::text[], ARRAY['ug/m3', 'µg/m³', 'μg/m³']::text[], ARRAY[]::text[]),
	('q1cf58u65svsx5e2mmke3ngj', 'pm25', 'ug/m3', 'PM2.5', 'µg/m³', ARRAY['particle 2 5', 'particle 2,5', 'particulate matter 2 5', 'particulate matter 2.5', 'feinstaub pm2 5', 'feinstaub pm2.5', 'pm 2 5', 'pm 2.5', 'pm2 5', 'pm2.5', 'pm25']::text[], ARRAY['ug/m3', 'µg/m³', 'μg/m³']::text[], ARRAY[]::text[]),
	('ljyovesdknazef0eodc7a1pw', 'ambient_light', 'lx', 'Ambient light', 'lx', ARRAY['ambient light', 'beleuchtungsstarke', 'beleuchtungsstärke', 'helligkeit', 'illuminance', 'light']::text[], ARRAY['lux', 'lx']::text[], ARRAY[]::text[]),
	('rlzpjxwtfery0iajzojwk0sr', 'ultraviolet_a_light', 'uW/cm2', 'UV intensity', 'µW/cm²', ARRAY['uv intensitat', 'uv intensität', 'uv intensity']::text[], ARRAY['uw/cm2', 'uw/cm²', 'µw/cm2', 'µw/cm²', 'μw/cm2', 'μw/cm²']::text[], ARRAY[]::text[]),
	('hlhh0z1vk2811urdkufgw2wi', 'ultraviolet_a_light', 'W/m²', 'Ultraviolet A light', 'W/m²', ARRAY['ultraviolet a light']::text[], ARRAY['w/m2', 'w/m²']::text[], ARRAY[]::text[]),
	('jaasx8k4mxv1kfeohj171u4s', 'soil_moisture', '%', 'Soil moisture', '%', ARRAY['bodenfeuchte', 'bodenfeuchte 10cm', 'bodenfeuchte 30cm', 'bodenfeuchte 60cm', 'bodenfeuchte_1', 'bodenfeuchte_2', 'soil moisture']::text[], ARRAY['%', 'percent']::text[], ARRAY[]::text[]),
	('c32aya4ss3xbm0r6y5x57zup', 'co2', 'ppm', 'CO2', 'ppm', ARRAY['carbon dioxide', 'co2']::text[], ARRAY['parts per million', 'ppm']::text[], ARRAY[]::text[]),
	('rnlbjyrzvis11ncmqanfedxy', 'humidity', NULL, 'Humidity', NULL, ARRAY['humedad', 'humidity']::text[], ARRAY[]::text[], ARRAY[]::text[]),
	('qy2pnztsoivmz3oyhfxrqvan', 'pm10_concentration', 'ug/m3', 'PM10 concentration', 'µg/m³', ARRAY['particulate matter 10 concentration', 'pm10 concentration']::text[], ARRAY['ug/m3', 'µg/m³', 'μg/m³']::text[], ARRAY[]::text[]),
	('ocx5dcipkano1w8um5d0951h', 'air_temperature', '°C', 'Air temperature', '°C', ARRAY['air temperature']::text[], ARRAY['c', 'cel', 'celsius', 'degc', 'degree celsius', '°c']::text[], ARRAY[]::text[]),
	('q8mpb706uciik9yocvddq2ar', 'precipitation', 'mm', 'Precipitation', 'mm', ARRAY['niederschlag', 'precipitation', 'rain rate', 'rainfall', 'regen stunde', 'regen tag', 'regenrate']::text[], ARRAY['in/hr', 'millimeter', 'mm', 'mm/d', 'mm/h']::text[], ARRAY[]::text[]),
	('ceepmslmeymjh3hbg8mqqd63', 'volatile_organic_compound_voc', NULL, 'Volatile organic compound (VOC)', NULL, ARRAY['tvoc', 'voc', 'volatile organic compound voc']::text[], ARRAY[]::text[], ARRAY[]::text[]),
	('n0hwirl6ysgdifjy935edppj', 'voltage', 'V', 'Voltage', 'V', ARRAY['batteriespannung', 'battery voltage', 'betriebsspannung', 'power supply', 'solar voltage', 'spannung', 'voltage']::text[], ARRAY['mv', 'millivolt', 'v', 'volt']::text[], ARRAY[]::text[]),
	('l9vgrvha9vyu4bwnkjrekbxt', 'sound_level', NULL, 'Sound level', NULL, ARRAY['durchschnitt umgebungslautstarke', 'durchschnitt umgebungslautstärke', 'lautstarke', 'lautstärke', 'minimum umgebungslautstarke', 'minimum umgebungslautstärke', 'noise', 'sound level', 'soundpresure dba', 'soundpressure dba']::text[], ARRAY['db', 'dba', 'dbavg', 'dbmin']::text[], ARRAY[]::text[]),
	('rrcn3vw1iyk539x44bj1r151', 'water_level', NULL, 'Water level', NULL, ARRAY['pegel', 'water level']::text[], ARRAY[]::text[], ARRAY[]::text[]),
	('rb6bjcz3pecjq1t8pd7fbiim', 'water_temperature', NULL, 'Water temperature', NULL, ARRAY['water temperature']::text[], ARRAY[]::text[], ARRAY[]::text[]),
	('r2d53q4rpi4nijio1q6cs6h5', 'wind_direction', NULL, 'Wind direction', NULL, ARRAY['wind direction', 'windrichtung']::text[], ARRAY[]::text[], ARRAY[]::text[]),
	('liz34huiogylbzrlqly6feq5', 'wind_speed', 'm/s', 'Wind speed', 'm/s', ARRAY['viento', 'wind boen', 'wind böen', 'wind gust speed', 'wind speed', 'windboen', 'windböen', 'windgeschwindigkeit', 'windstarke', 'windstärke']::text[], ARRAY['m/s', 'meter per second', 'miles per hour', 'mph']::text[], ARRAY[]::text[])
ON CONFLICT ON CONSTRAINT "sensor_wiki_alias_phenomenon_unit_unique" DO NOTHING;
