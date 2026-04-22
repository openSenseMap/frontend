import { useTranslation } from 'react-i18next'
import { redirect, useLoaderData } from 'react-router'
import { type Route } from './+types/profile.$username'
import { getColumns } from '~/components/mydevices/dt/columns'
import { DataTable } from '~/components/mydevices/dt/data-table'
import { NavBar } from '~/components/nav-bar'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import {
	getProfileByUserId,
	getProfileByUsername,
	getProfileSensorsAndMeasurementsCount,
} from '~/db/models/profile.server'
import { claimBox } from '~/services/transfer-service.server'
import { userNameFromURl } from '~/services/user-service.server'
import { getInitials } from '~/lib/strings'
import { formatCount } from '~/lib/numbers'
import { getUserId } from '~/services/session-service.server'

type ActionData = {
	success: boolean
	message?: string
	error?: string
	claimedBoxId?: string
}

export async function loader({ params, request }: Route.LoaderArgs) {
	const requestingUserId = await getUserId(request)

	const username = userNameFromURl(params.username as string)
	if (!username) {
		return {
			profile: null,
			requestingUserId,
			sensorsCount: '0',
			measurementsCount: '0',
		}
	}

	const profile = await getProfileByUsername(username)

	if (!profile) return redirect('/explore')

	// Block access only if private AND not the owner
	if (!profile.public && requestingUserId !== profile.userId) {
		return redirect('/explore')
	}

	const counts = await getProfileSensorsAndMeasurementsCount(profile)

	return {
		profile,
		requestingUserId,
		sensorsCount: counts.sensorsCount,
		measurementsCount: counts.measurementsCount,
	}
}

export async function action({ request, params }: Route.ActionArgs) {
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const username = params.username
	if (!username) {
		return {
			success: false,
			error: 'Missing username.',
		} satisfies ActionData
	}

	const profile = await getProfileByUserId(userId)
	if (!profile || profile.userId !== userId) {
		return {
			success: false,
			error: 'You can only claim a device from your own profile page.',
		} satisfies ActionData
	}

	const formData = await request.formData()
	const intent = formData.get('intent')?.toString()
	const token = formData.get('token')?.toString().trim()

	if (intent !== 'claim-device') {
		return {
			success: false,
			error: 'Unknown action.',
		} satisfies ActionData
	}

	if (!token) {
		return {
			success: false,
			error: 'Please enter a transfer token.',
		} satisfies ActionData
	}

	try {
		const result = await claimBox(userId, token)

		return {
			success: true,
			message: result.message,
			claimedBoxId: result.boxId,
		} satisfies ActionData
	} catch (err) {
		const message =
			err instanceof Error ? err.message : 'Failed to claim device.'

		return {
			success: false,
			error: message,
		} satisfies ActionData
	}
}

export default function ProfilePage() {
	const { profile, sensorsCount, measurementsCount, requestingUserId } =
		useLoaderData<typeof loader>()

	const { t } = useTranslation('profile')
	const columnsTranslation = useTranslation('data-table')

	const isOwner = !!profile?.userId && requestingUserId === profile.userId

	return (
		<div className="h-full bg-slate-100">
			<NavBar />
			<div className="flex w-full flex-col gap-6 p-8 md:flex-row md:gap-8 md:pt-4">
				<div className="dark:bg-dark-background flex w-full flex-col gap-6 rounded-xl bg-white p-6 shadow-lg md:w-1/3">
					<div className="dark:text-dark-text flex items-center gap-4">
						<Avatar className="h-16 w-16">
							{profile?.profileImage?.id ? (
								<AvatarImage
									className="aspect-auto h-full w-full rounded-full object-cover"
									src={`/resources/file/${profile.profileImage.id}`}
								/>
							) : null}
							<AvatarFallback>
								{getInitials(profile?.displayName ?? '')}
							</AvatarFallback>
						</Avatar>
						<div>
							<h3 className="dark:text-dark-text text-2xl font-semibold">
								{profile?.displayName || ''}
							</h3>
							<h4 className="dark:text-dark-text text-lg">
								{profile?.user?.name || ''}
							</h4>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								{t('user_since')}{' '}
								{new Date(profile?.user?.createdAt || '').toLocaleDateString(
									t('locale'),
								)}
							</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4 md:pt-6">
						<div className="dark:bg-dark-boxes flex flex-col items-center rounded-lg bg-gray-100 p-4">
							<span className="dark:text-dark-green text-2xl font-bold">
								{formatCount(profile?.user?.devices.length || 0)}
							</span>
							<span className="text-sm text-gray-500 dark:text-gray-400">
								{t('devices')}
							</span>
						</div>
						<div className="dark:bg-dark-boxes flex flex-col items-center rounded-lg bg-gray-100 p-4">
							<span className="dark:text-dark-green text-2xl font-bold">
								{sensorsCount}
							</span>
							<span className="text-sm text-gray-500 dark:text-gray-400">
								{t('sensors')}
							</span>
						</div>
						<div className="dark:bg-dark-boxes flex flex-col items-center rounded-lg bg-gray-100 p-4">
							<span className="dark:text-dark-green text-2xl font-bold">
								{measurementsCount}
							</span>
							<span className="text-sm text-gray-500 dark:text-gray-400">
								{t('measurements')}
							</span>
						</div>
					</div>
				</div>

				<div className="flex w-full flex-col gap-6 md:w-2/3">
					<div className="dark:bg-dark-background rounded-xl bg-white p-6 shadow-lg">
						<div className="text-light-green dark:text-dark-green mb-4 text-3xl font-semibold">
							{t('devices')}
						</div>

						{profile?.user?.devices && (
							<DataTable
								columns={getColumns(columnsTranslation, { isOwner })}
								data={profile.user.devices}
								getRowClassName={(device) =>
									device.archivedAt
										? 'opacity-60 bg-slate-100 dark:bg-slate-900/40'
										: ''
								}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
