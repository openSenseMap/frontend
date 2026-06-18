import { and, count, eq } from 'drizzle-orm'
import { drizzleClient } from '~/db.server'
import { campaignBookmark, type Campaign, type User } from '~/db/schema'

export async function bookmarkCampaign({
	campaignId,
	userId,
}: {
	campaignId: Campaign['id']
	userId: User['id']
}) {
	await drizzleClient
		.insert(campaignBookmark)
		.values({ campaignId, userId })
		.onConflictDoNothing()
}

export async function removeCampaignBookmark({
	campaignId,
	userId,
}: {
	campaignId: Campaign['id']
	userId: User['id']
}) {
	await drizzleClient
		.delete(campaignBookmark)
		.where(
			and(
				eq(campaignBookmark.campaignId, campaignId),
				eq(campaignBookmark.userId, userId),
			),
		)
}

export async function isCampaignBookmarked({
	campaignId,
	userId,
}: {
	campaignId: Campaign['id']
	userId: User['id']
}) {
	const bookmark = await drizzleClient.query.campaignBookmark.findFirst({
		where: (bookmark, { and, eq }) =>
			and(eq(bookmark.campaignId, campaignId), eq(bookmark.userId, userId)),
		columns: {
			id: true,
		},
	})

	return Boolean(bookmark)
}

export async function getCampaignBookmarkCount(campaignId: Campaign['id']) {
	const [result] = await drizzleClient
		.select({ value: count() })
		.from(campaignBookmark)
		.where(eq(campaignBookmark.campaignId, campaignId))

	return result.value
}
