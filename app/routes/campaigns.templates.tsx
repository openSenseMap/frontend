import { Outlet } from 'react-router'
import { type Route } from './+types/campaigns.templates'

export function loader(_: Route.LoaderArgs) {
	return null
}

export default function CampaignTemplatesLayout() {
	return <Outlet />
}
