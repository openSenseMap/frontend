import {
	and,
	arrayOverlaps,
	count,
	desc,
	eq,
	gt,
	gte,
	ilike,
	isNull,
	lt,
	lte,
	or,
} from 'drizzle-orm'
import { drizzleClient } from '~/db.server'
import {
	campaign,
	type Campaign,
	type InsertCampaign,
	type User,
} from '~/db/schema'
import { slugifyCampaignTitle } from '~/lib/campaign'

export type CampaignListFilters = {
	query?: string
	phenomenon?: string
	status?: 'active' | 'upcoming' | 'ended'
}

export async function createCampaign(
	values: Omit<InsertCampaign, 'id' | 'slug' | 'createdAt' | 'updatedAt'> & {
		title: string
	},
) {
	const slug = await getAvailableCampaignSlug(values.title)

	const [createdCampaign] = await drizzleClient
		.insert(campaign)
		.values({
			...values,
			slug,
		})
		.returning()

	return createdCampaign
}

export async function getCampaignBySlug(slug: Campaign['slug']) {
	return drizzleClient.query.campaign.findFirst({
		where: (campaign, { and, eq }) =>
			and(eq(campaign.slug, slug), eq(campaign.public, true)),
		with: {
			owner: {
				columns: {
					id: true,
					name: true,
				},
			},
		},
	})
}

export async function getCampaigns(filters: CampaignListFilters = {}) {
	const where = getCampaignWhere(filters)

	return drizzleClient.query.campaign.findMany({
		where,
		with: {
			owner: {
				columns: {
					id: true,
					name: true,
				},
			},
		},
		orderBy: (campaign, { desc }) => [
			desc(campaign.startDate),
			desc(campaign.createdAt),
		],
	})
}

export async function getCampaignCount(filters: CampaignListFilters = {}) {
	const where = getCampaignWhere(filters)
	const [result] = await drizzleClient
		.select({ value: count() })
		.from(campaign)
		.where(where)

	return result.value
}

export async function getOwnCampaigns(userId: User['id']) {
	return drizzleClient.query.campaign.findMany({
		where: (campaign, { eq }) => eq(campaign.ownerId, userId),
		orderBy: [desc(campaign.createdAt)],
	})
}

async function getAvailableCampaignSlug(title: string) {
	const baseSlug = slugifyCampaignTitle(title) || 'campaign'
	let slug = baseSlug
	let index = 2

	while (await campaignSlugExists(slug)) {
		slug = `${baseSlug}-${index}`
		index += 1
	}

	return slug
}

async function campaignSlugExists(slug: string) {
	const existingCampaign = await drizzleClient.query.campaign.findFirst({
		where: (campaign, { eq }) => eq(campaign.slug, slug),
		columns: {
			id: true,
		},
	})

	return Boolean(existingCampaign)
}

function getCampaignWhere(filters: CampaignListFilters) {
	const conditions = [eq(campaign.public, true)]

	if (filters.query) {
		const query = `%${filters.query}%`
		conditions.push(
			or(ilike(campaign.title, query), ilike(campaign.description, query))!,
		)
	}

	if (filters.phenomenon) {
		conditions.push(arrayOverlaps(campaign.phenomena, [filters.phenomenon]))
	}

	if (filters.status) {
		const now = new Date()

		if (filters.status === 'active') {
			conditions.push(
				and(
					or(isNull(campaign.startDate), lte(campaign.startDate, now)),
					or(isNull(campaign.endDate), gte(campaign.endDate, now)),
				)!,
			)
		}

		if (filters.status === 'upcoming') {
			conditions.push(gt(campaign.startDate, now))
		}

		if (filters.status === 'ended') {
			conditions.push(lt(campaign.endDate, now))
		}
	}

	return and(...conditions)
}
