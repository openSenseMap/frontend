import { Link } from 'react-router'
import  { type Route } from './+types/admin.devices._index'
import { getDevices } from '~/models/device.server'
import { requireAdmin } from '~/utils/session.server'

export async function loader({ request }: Route.LoaderArgs) {
	await requireAdmin(request)

	const devices = await getDevices('json')

	return ({ devices })
}

export default function AdminDevicesIndexRoute({
	loaderData,
}: Route.ComponentProps) {
	const { devices } = loaderData

	return (
		<div className="flex flex-col w-full">
			<div className="flex">
				<span className="text-lg font-bold p-4">
					Total devices: {devices.length}
				</span>
			</div>

			<div className="flex justify-center">
				<table>
					<thead className="border-2 border-black">
						<tr>
							<th className="border-r-2 border-black p-2">ID</th>
							<th className="border-r-2 border-black p-2">Name</th>
							<th className="border-r-2 border-black p-2">Exposure</th>
							<th className="border-r-2 border-black p-2">Status</th>
							<th className="border-r-2 border-black p-2">Created</th>
							<th className="border-r-2 border-black p-2"></th>
						</tr>
					</thead>

					<tbody className="border-2 border-black">
						{devices.map((device) => (
							<tr key={device.id} className="border-2 border-black">
								<td className="border-r-2 border-black p-2">{device.id}</td>
								<td className="border-r-2 border-black p-2">{device.name}</td>
								<td className="border-r-2 border-black p-2">
									{device.exposure}
								</td>
								<td className="border-r-2 border-black p-2">{device.status}</td>
								<td className="border-r-2 border-black p-2">
									{new Date(device.createdAt).toLocaleString()}
								</td>
								<td className="border-r-2 border-black p-2">
									<Link
										to={`/admin/devices/${device.id}`}
										className="cursor-pointer hover:underline hover:underline-offset-2"
									>
										Open
									</Link>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}