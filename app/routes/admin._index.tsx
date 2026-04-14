import { Link } from 'react-router'
import  { type Route } from './+types/admin._index'
import { requireAdmin } from '~/utils/session.server'

export async function loader({ request }: Route.LoaderArgs) {
	await requireAdmin(request)
	return null
}

export default function AdminIndexRoute() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh]">
			<h1 className="text-2xl font-semibold">openSenseMap Admin Tool</h1>

			<div className="mt-6 flex gap-4">
				<div className="border p-4 rounded">
					<Link to="/admin/users">Edit users</Link>
				</div>
				<div className="border p-4 rounded">
					<Link to="/admin/devices">Edit devices</Link>
				</div>
			</div>
		</div>
	)
}