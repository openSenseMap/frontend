import { ArrowLeft } from 'lucide-react'
import {
	redirect,
	Link,
	useLoaderData,
	type LoaderFunctionArgs,
} from 'react-router'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import ErrorMessage from '~/components/error-message'
import { NavBar } from '~/components/nav-bar'
import { Separator } from '~/components/ui/separator'
import { getDeviceWithoutSensors } from '~/models/device.server'
import { getSensorsFromDevice } from '~/models/sensor.server'
import { getUserId } from '~/utils/session.server'

//*****************************************************
export async function loader({ request, params }: LoaderFunctionArgs) {
	//* if user is not logged in, redirect to home
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	if (!params.deviceId) {
		throw new Response('Device not found', { status: 502 })
	}
	//* get device data
	const deviceData = await getDeviceWithoutSensors({ id: params.deviceId })
	//* get sensors data
	const sensorsData = await getSensorsFromDevice(params.deviceId)

	return { deviceData, sensorsData }
}

//*****************************************************
export async function action() {
	return {}
}

//**********************************
export default function DeviceOverview() {
	const { deviceData, sensorsData } = useLoaderData<typeof loader>()

	return (
		<div className="space-y-6 px-10 pb-16 font-helvetica">
			<NavBar />
			<div className="rounded text-[#676767]">
				<ArrowLeft className="mr-2 inline h-5 w-5" />
				<Link to="/profile/me">Back to Dashboard</Link>
			</div>

			<div className="space-y-0.5">
				<h2 className="text-3xl font-bold tracking-normal">Device Overview</h2>
				<p className="text-muted-foreground">
					View device details and sensors.
				</p>
			</div>
			<Separator />

			<h2 className="text-2xl font-bold tracking-normal">Device</h2>
			{/* sensebox table */}
			<Table>
				<TableBody className="border-[1px]">
					<TableRow>
						<TableCell className="w-[50%] border-r-[1px]">
							Device Name
						</TableCell>
						<TableCell className="w-[50%] border-r-[1px] font-semibold">
							{deviceData?.name}
						</TableCell>
					</TableRow>

					<TableRow>
						<TableCell className="w-[50%] border-r-[1px]">
							Device Model
						</TableCell>
						<TableCell className="w-[50%] border-r-[1px] font-semibold">
							XXXX
						</TableCell>
					</TableRow>

					<TableRow>
						<TableCell className="w-[50%] border-r-[1px]">
							Greoup identifier
						</TableCell>
						<TableCell className="w-[50%] border-r-[1px] font-semibold">
							XXXX
						</TableCell>
					</TableRow>

					<TableRow>
						<TableCell className="w-[50%] border-r-[1px]">Exposure</TableCell>
						<TableCell className="w-[50%] border-r-[1px] font-semibold">
							{deviceData?.exposure}
						</TableCell>
					</TableRow>

					<TableRow>
						<TableCell className="w-[50%] border-r-[1px]">Device ID</TableCell>
						<TableCell className="w-[50%] border-r-[1px] font-semibold">
							{deviceData?.id}
						</TableCell>
					</TableRow>

					<TableRow>
						<TableCell className="w-[50%] border-r-[1px]">
							Access Token
						</TableCell>
						<TableCell className="w-[50%] border-r-[1px] font-semibold">
							XXX
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>

			<h2 className="text-2xl font-bold tracking-normal">Sensors & IDs</h2>
			{/* sensers table */}
			<Table>
				<TableBody className="border-[1px]">
					{sensorsData.map((sensor) => (
						<TableRow key={sensor.id}>
							<TableCell className="w-[50%] border-r-[1px]">
								{sensor?.title}
							</TableCell>
							<TableCell className="w-[50%] border-r-[1px] font-semibold">
								{sensor?.id}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<div className="flex h-screen w-screen items-center justify-center">
			<ErrorMessage />
		</div>
	)
}
