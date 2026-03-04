import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	if (!params.deviceId) {
		throw new Response('Device not found', { status: 502 })
	}
	const deviceData = await getDeviceWithoutSensors({ id: params.deviceId })
	const sensorsData = await getSensorsFromDevice(params.deviceId)

	return { deviceData, sensorsData, userId }
}

//*****************************************************
export async function action() {
	return {}
}

//**********************************
export default function DeviceOverview() {
	const { deviceData, sensorsData, userId } = useLoaderData<typeof loader>()
	const {t} = useTranslation('device-overview')

	return (
		<div className="space-y-6 px-10 pb-16 font-helvetica">
			<NavBar />
			<div className="rounded text-[#676767]">
				<ArrowLeft className="mr-2 inline h-5 w-5" />
				<Link to="/profile/me">{t('back_to_dashboard')}</Link>
			</div>

			<div className="space-y-0.5">
				<h2 className="text-3xl font-bold tracking-normal">{t('device_overview')}</h2>
				<p className="text-muted-foreground">
					{t('show_details')}
				</p>
			</div>
			<Separator />

			<h2 className="text-2xl font-bold tracking-normal">{t('device')}</h2>
			{/* sensebox table */}
			<Table>
				<TableBody className="border-[1px]">
					<TableRow>
						<TableCell className="w-[50%] border-r-[1px]">
							Name
						</TableCell>
						<TableCell className="w-[50%] border-r-[1px] font-semibold">
							{deviceData?.name}
						</TableCell>
					</TableRow>

					<TableRow>
						<TableCell className="w-[50%] border-r-[1px]">
							 Model
						</TableCell>
						<TableCell className="w-[50%] border-r-[1px] font-semibold">
							{deviceData?.model}
						</TableCell>
					</TableRow>

					<TableRow>
						<TableCell className="w-[50%] border-r-[1px]">
							Tag
						</TableCell>
						<TableCell className="w-[50%] border-r-[1px] font-semibold">
							{deviceData?.tags}
						</TableCell>
					</TableRow>

					<TableRow>
						<TableCell className="w-[50%] border-r-[1px]">{t('exposure')}</TableCell>
						<TableCell className="w-[50%] border-r-[1px] font-semibold">
							{deviceData?.exposure}
						</TableCell>
					</TableRow>

					<TableRow>
						<TableCell className="w-[50%] border-r-[1px]">ID</TableCell>
						<TableCell className="w-[50%] border-r-[1px] font-semibold">
							{deviceData?.id}
						</TableCell>
					</TableRow>

					{userId === deviceData?.userId && (
					<TableRow>
						<TableCell className="w-[50%] border-r-[1px]">
							Access Token
						</TableCell>
						<TableCell className="w-[50%] border-r-[1px] font-semibold">
							{deviceData?.apiKey}
						</TableCell>
					</TableRow>
					)}
				</TableBody>
			</Table>

			<h2 className="text-2xl font-bold tracking-normal">{t('sensors')}</h2>
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
