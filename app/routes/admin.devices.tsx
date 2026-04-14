// import maplibreStyles from 'maplibre-gl/dist/maplibre-gl.css?url'
import  { type LinksFunction, Outlet } from 'react-router'
import  { type Route } from './+types/admin.devices'
import { requireAdmin } from '~/utils/session.server'


// export const links: LinksFunction = () => [
// 	{ rel: 'stylesheet', href: maplibreStyles },
// ]

export async function loader({ request }: Route.LoaderArgs) {
	await requireAdmin(request)
	return null
}

export default function AdminDevicesLayoutRoute() {
	return (
		<main className="container mx-auto p-4">
			<Outlet />
		</main>
	)
}