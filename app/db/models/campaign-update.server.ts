import { desc } from 'drizzle-orm'
import { drizzleClient } from '~/db.server'
import { campaignUpdate, type Campaign, type User } from '~/db/schema'

export async function createCampaignUpdate({
	campaignId,
	authorId,
	body,
}: {
	campaignId: Campaign['id']
	authorId: User['id']
	body: string
}) {
	const [createdUpdate] = await drizzleClient
		.insert(campaignUpdate)
		.values({
			campaignId,
			authorId,
			body,
		})
		.returning()

	return createdUpdate
}

export async function getCampaignUpdates(campaignId: Campaign['id']) {
	return drizzleClient.query.campaignUpdate.findMany({
		where: (update, { eq }) => eq(update.campaignId, campaignId),
		with: {
			author: {
				columns: {
					id: true,
					name: true,
				},
			},
		},
		orderBy: [desc(campaignUpdate.createdAt)],
	})
}
