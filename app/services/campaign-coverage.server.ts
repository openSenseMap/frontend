import bbox from '@turf/bbox'
import { and, eq, gte, inArray, isNull, lte, sql, type SQL } from 'drizzle-orm'
import { drizzleClient } from '~/db.server'
import { device, measurement, sensor, type Campaign } from '~/db/schema'
import {
	buildCampaignCoverageGrid,
	pointInCampaignArea,
	type CampaignCoveragePoint,
} from '~/lib/campaign-coverage'
import { type CampaignArea } from '~/lib/campaign'

export async function getCampaignCoverage(campaign: Campaign) {
	const area = campaign.area as CampaignArea
	const [minLongitude, minLatitude, maxLongitude, maxLatitude] = bbox(area)

	const measurementConditions: SQL[] = [
		eq(measurement.sensorId, sensor.id),
		campaign.startDate ? gte(measurement.time, campaign.startDate) : undefined,
		campaign.endDate ? lte(measurement.time, campaign.endDate) : undefined,
	].filter((condition): condition is SQL => Boolean(condition))

	const rows = await drizzleClient
		.select({
			deviceId: device.id,
			deviceName: device.name,
			longitude: device.longitude,
			latitude: device.latitude,
			sensorCount: sql<number>`count(distinct ${sensor.id})`,
			measurementCount: sql<number>`count(${measurement.value})`,
		})
		.from(device)
		.innerJoin(sensor, eq(sensor.deviceId, device.id))
		.leftJoin(measurement, and(...measurementConditions))
		.where(
			and(
				eq(device.public, true),
				isNull(device.archivedAt),
				inArray(sensor.title, campaign.phenomena),
				gte(device.longitude, minLongitude),
				lte(device.longitude, maxLongitude),
				gte(device.latitude, minLatitude),
				lte(device.latitude, maxLatitude),
			),
		)
		.groupBy(device.id, device.name, device.longitude, device.latitude)

	const points: CampaignCoveragePoint[] = rows
		.filter((row) => pointInCampaignArea([row.longitude, row.latitude], area))
		.map((row) => ({
			deviceId: row.deviceId,
			deviceName: row.deviceName,
			longitude: row.longitude,
			latitude: row.latitude,
			sensorCount: Number(row.sensorCount),
			measurementCount: Number(row.measurementCount),
		}))

	return buildCampaignCoverageGrid({
		area,
		points,
		requirements: {
			gridSize: campaign.gridSize,
			minDevicesPerCell: campaign.minDevicesPerCell,
			minMeasurementsPerCell: campaign.minMeasurementsPerCell,
		},
	})
}
