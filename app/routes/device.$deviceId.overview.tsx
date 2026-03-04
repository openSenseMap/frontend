import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
	redirect,
	Link,
	useLoaderData,
	type LoaderFunctionArgs,
} from 'react-router'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { NavBar } from '~/components/nav-bar'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
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
	const { t } = useTranslation('device-overview')

	return (
		<div className="space-y-6 px-4 pb-16 font-helvetica sm:px-6 lg:px-8">
			<NavBar />
			<div className="grid grid-cols-8 gap-10 font-helvetica text-[15px] tracking-wide max-md:grid-cols-2 lg:grid-rows-1">
				<nav className="col-span-2 md:col-span-2">
					<ul>
						<li className="rounded p-3 text-[#676767] hover:bg-[#eee]">
							<ArrowLeft className="mr-2 inline h-5 w-5" />
							<Link to="/profile/me">{t('back_to_dashboard')}</Link>
						</li>
					</ul>
				</nav>

				<main className="col-span-6 px-4 py-12 md:col-span-6">
					<div className="space-y-0.5 text-center">
						<h2 className="text-3xl font-bold tracking-normal">
							{t('device_overview')}
						</h2>
						<p className="text-muted-foreground">{t('show_details')}</p>
					</div>

					{/* sensebox table */}
					<Card className="mt-10">
						<CardHeader>
							<CardTitle>{t('device')}</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
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
										<TableCell className="w-[50%] border-r-[1px]">
											{t('exposure')}
										</TableCell>
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
												API Key
											</TableCell>
											<TableCell className="w-[50%] border-r-[1px] font-semibold">
												{deviceData?.apiKey}
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>

					{/* sensers table */}
					<Card className="mt-10">
						<CardHeader>
							<CardTitle>{t('sensors')}</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
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
						</CardContent>
					</Card>
				</main>
			</div>
		</div>
	)
}
