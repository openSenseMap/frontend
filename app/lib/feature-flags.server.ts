export function isCampaignsEnabled() {
	return parseBooleanFlag(process.env.ENABLE_CAMPAIGNS)
}

export function requireCampaignsEnabled() {
	if (!isCampaignsEnabled()) {
		throw new Response('Not found', { status: 404 })
	}
}

function parseBooleanFlag(value: string | undefined) {
	return value === 'true' || value === '1'
}
