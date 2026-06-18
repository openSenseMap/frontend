import { Outlet } from 'react-router'
import { type Route } from './+types/campaigns'
import { requireCampaignsEnabled } from '~/lib/feature-flags.server'

export function loader(_: Route.LoaderArgs) {
	requireCampaignsEnabled()

	return null
}

export default function CampaignsLayout() {
	return <Outlet />
}
