import { desc } from 'drizzle-orm'
import { drizzleClient } from '~/db.server'
import {
	campaignTemplate,
	type CampaignTemplateRecord,
	type InsertCampaignTemplate,
	type User,
} from '~/db/schema'

export async function createUserCampaignTemplate(
	values: Omit<
		InsertCampaignTemplate,
		'id' | 'createdAt' | 'updatedAt' | 'ownerId'
	> & {
		ownerId: User['id']
	},
) {
	const [createdTemplate] = await drizzleClient
		.insert(campaignTemplate)
		.values(values)
		.returning()

	return createdTemplate
}

export async function getUserCampaignTemplates(userId: User['id']) {
	return drizzleClient.query.campaignTemplate.findMany({
		where: (template, { eq }) => eq(template.ownerId, userId),
		orderBy: [
			desc(campaignTemplate.updatedAt),
			desc(campaignTemplate.createdAt),
		],
	})
}

export async function getUserCampaignTemplateById({
	id,
	userId,
}: {
	id: CampaignTemplateRecord['id']
	userId: User['id']
}) {
	return drizzleClient.query.campaignTemplate.findFirst({
		where: (template, { and, eq }) =>
			and(eq(template.id, id), eq(template.ownerId, userId)),
	})
}
