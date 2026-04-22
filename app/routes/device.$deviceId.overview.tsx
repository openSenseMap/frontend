import { ArrowLeft, ClipboardCopy, CopyCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	redirect,
	Link,
	useLoaderData,
} from 'react-router'
import { type Route } from './+types/device.$deviceId.overview'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { NavBar } from '~/components/nav-bar'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { getDeviceWithoutSensors } from '~/db/models/device.server'
import { getSensorsFromDevice } from '~/db/models/sensor.server'
import { getUserId } from '~/utils/session.server'

export async function loader({ request, params }: Route.LoaderArgs) {
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	if (!params.deviceId) {
		throw new Response('Device not found', { status: 502 })
	}
	const deviceData = await getDeviceWithoutSensors({ id: params.deviceId })
	const sensorsData = await getSensorsFromDevice(params.deviceId)

	// If the user is accessing someone elses device, the apiKey should not be leaked
	if (deviceData && userId !== deviceData.userId) deviceData.apiKey = null

	return { deviceData, sensorsData, userId }
}

export default function DeviceOverview() {
	const { deviceData, sensorsData, userId } = useLoaderData<typeof loader>()
	const { t } = useTranslation('device-overview')
	const [copiedToClipboard, setCopiedToClipboard] = useState<string | null>(
		null,
	)

	const copyToClipboard = async (
		id: string,
		value: string | undefined | null,
	) => {
		if (value === undefined || value === null) return
		await navigator.clipboard.writeText(value)
		setCopiedToClipboard(id)
	}

	useEffect(() => {
		if (copiedToClipboard === null) return
		const timer = window.setTimeout(() => {
			setCopiedToClipboard(null)
		}, 2_500)

		return () => window.clearTimeout(timer)
	}, [copiedToClipboard])

	return (
		<div className="space-y-6 px-4 pb-16 font-helvetica sm:px-6 lg:px-8">
			<NavBar />

			<p className="inline-block rounded p-3 text-[#676767] hover:bg-[#eee]">
				<ArrowLeft className="mr-2 inline h-5 w-5" />
				<Link to="/profile/me">{t('back_to_dashboard')}</Link>
			</p>

			<main className="mx-auto max-w-(--breakpoint-xl)">
				<div className="space-y-0.5 text-center">
					<h2 className="text-3xl font-bold tracking-normal">
						{t('device_overview')}
					</h2>
					<p className="text-muted-foreground">{t('show_details')}</p>
				</div>

				<Card className="mt-5">
					<CardHeader>
						<CardTitle>{t('device')}</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableBody className="border">
								<TableRow>
									<TableCell className="border-r">
										{t('name_label')}
									</TableCell>
									<TableCell className="border-r font-semibold">
										<div className="flex items-center">
											<div className="grow">{deviceData?.name}</div>
											<div>
												{copiedToClipboard === 'name' ? (
													<CopyCheck />
												) : (
													<ClipboardCopy
														onClick={() =>
															copyToClipboard('name', deviceData?.name)
														}
													/>
												)}
											</div>
										</div>
									</TableCell>
								</TableRow>

								<TableRow>
									<TableCell className="border-r">
										{t('model_label')}
									</TableCell>
									<TableCell className="border-r font-semibold">
										{deviceData?.model}
									</TableCell>
								</TableRow>

								<TableRow>
									<TableCell className="border-r">
										{t('tags_label')}
									</TableCell>
									<TableCell className="border-r font-semibold">
										{deviceData?.tags?.join(', ')}
									</TableCell>
								</TableRow>

								<TableRow>
									<TableCell className="border-r">
										{t('exposure')}
									</TableCell>
									<TableCell className="border-r font-semibold">
										{deviceData?.exposure}
									</TableCell>
								</TableRow>

								<TableRow>
									<TableCell className="border-r">ID</TableCell>
									<TableCell className="border-r font-semibold">
										<div className="flex items-center">
											<div className="grow">{deviceData?.id}</div>
											<div>
												{copiedToClipboard === 'id' ? (
													<CopyCheck />
												) : (
													<ClipboardCopy
														onClick={() =>
															copyToClipboard('id', deviceData?.id)
														}
													/>
												)}
											</div>
										</div>
									</TableCell>
								</TableRow>

								{userId === deviceData?.userId && (
									<TableRow>
										<TableCell className="border-r">
											{t('api_key_label')}
										</TableCell>
										<TableCell className="border-r font-semibold">
											<div className="flex items-center">
												<div className="grow">{deviceData?.apiKey}</div>
												<div>
													{copiedToClipboard === 'apiKey' ? (
														<CopyCheck />
													) : (
														<ClipboardCopy
															onClick={() =>
																copyToClipboard('apiKey', deviceData?.apiKey)
															}
														/>
													)}
												</div>
											</div>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				<Card className="mt-5">
					<CardHeader>
						<CardTitle>{t('sensors')}</CardTitle>
					</CardHeader>
					<CardContent className="pt-0">
						<Table>
							<TableBody className="border">
								{sensorsData.map((sensor) => (
									<TableRow key={sensor.id}>
										<TableCell className="border-r">
											{sensor?.title}
										</TableCell>
										<TableCell className="border-r font-semibold">
											<div className="flex items-center">
												<div className="grow">{sensor?.id}</div>
												<div>
													{copiedToClipboard ===
													`${sensor?.title}_${sensor?.id}` ? (
														<CopyCheck />
													) : (
														<ClipboardCopy
															onClick={() =>
																copyToClipboard(
																	`${sensor?.title}_${sensor?.id}`,
																	sensor?.id,
																)
															}
														/>
													)}
												</div>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</main>
		</div>
	)
}
