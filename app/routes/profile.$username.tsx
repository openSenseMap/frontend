import { type LoaderFunctionArgs, redirect, useLoaderData } from 'react-router'
import ErrorMessage from '~/components/error-message'
import { columns } from '~/components/mydevices/dt/columns'
import { DataTable } from '~/components/mydevices/dt/data-table'
import { NavBar } from '~/components/nav-bar'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { getProfileByUsername } from '~/models/profile.server'
import { getInitials } from '~/utils/misc'
import { getUserId } from '~/utils/session.server'

export async function loader({ params, request }: LoaderFunctionArgs) {
	const requestingUserId = await getUserId(request)
	// Get username or userid from URL params
	const username = params.username

	if (username) {
		// Check if user exists
		const profile = await getProfileByUsername(username)
		// If the user exists and their profile is public, fetch their data or
		if (
			(!profile || !profile.public) &&
			requestingUserId !== profile?.user?.id
		) {
			return redirect('/explore')
		} else {
			// const profileMail = profile?.user?.email || ''
			// Get the access token using the getMyBadgesAccessToken function
			// const authToken = await getMyBadgesAccessToken().then((authData) => {
			//   return authData.access_token;
			// });

			// // Retrieve the user's backpack data and all available badges from the server
			// const backpackData = await getUserBackpack(profileMail, authToken).then(
			//   (backpackData: MyBadge[]) => {
			//     return getUniqueActiveBadges(backpackData);
			//   },
			// );

			// const allBadges = await getAllBadges(authToken).then((allBadges) => {
			//   return allBadges.result as BadgeClass[];
			// });

			// Return the fetched data as JSON
			return {
				// userBackpack: backpackData || [],
				// allBadges: allBadges,
				profile: profile,
				requestingUserId: requestingUserId,
			}
		}
	}

	// If the user data couldn't be fetched, return an empty JSON response
	return {
		// userBackpack: [],
		// allBadges: [],
		profile: null,
		requestingUserId: requestingUserId,
	}
}

export default function () {
	// Get the data from the loader function using the useLoaderData hook
	const { profile } = useLoaderData<typeof loader>()

	// const sortedBadges = sortBadges(allBadges, userBackpack);

	return (
		<div className="h-full bg-slate-100">
			<NavBar />
			<div className="flex w-full flex-col gap-6 p-8 md:flex-row md:gap-8 md:pt-4">
				<div className="flex w-full flex-col gap-6 rounded-xl bg-white p-6 shadow-lg dark:bg-dark-background md:w-1/3">
					<div className="flex items-center gap-4 dark:text-dark-text">
						<Avatar className="h-16 w-16">
							<AvatarImage
								className="aspect-auto h-full w-full rounded-full object-cover"
								src={'/resources/file/' + profile?.profileImage?.id}
							/>
							<AvatarFallback>
								{getInitials(profile?.username ?? '')}
							</AvatarFallback>
						</Avatar>
						<div>
							<h3 className="text-2xl font-semibold dark:text-dark-text">
								{profile?.user?.name || ''}
							</h3>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								User since{' '}
								{new Date(profile?.user?.createdAt || '').toLocaleDateString()}
							</p>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4 md:pt-6">
						<div className="flex flex-col items-center rounded-lg bg-gray-100 p-4 dark:bg-dark-boxes">
							<span className="text-2xl font-bold dark:text-dark-green">
								{profile?.user?.devices.length}
							</span>
							<span className="text-sm text-gray-500 dark:text-gray-400">
								Devices
							</span>
						</div>
						<div className="flex flex-col items-center rounded-lg bg-gray-100 p-4 dark:bg-dark-boxes">
							<span className="text-2xl font-bold dark:text-dark-green">
								coming soon
							</span>
							<span className="text-sm text-gray-500 dark:text-gray-400">
								Sensors
							</span>
						</div>
						<div className="flex flex-col items-center rounded-lg bg-gray-100 p-4 dark:bg-dark-boxes">
							<span className="text-2xl font-bold dark:text-dark-green">
								coming soon
							</span>
							<span className="text-sm text-gray-500 dark:text-gray-400">
								Measurements
							</span>
						</div>
						<div className="flex flex-col items-center rounded-lg bg-gray-100 p-4 dark:bg-dark-boxes">
							{/* <span className="text-2xl font-bold dark:text-dark-green">
								{userBackpack.length}
							</span> */}
							<span className="text-sm text-gray-500 dark:text-gray-400">
								Badges
							</span>
						</div>
					</div>
				</div>
				<div className="flex w-full flex-col gap-6 md:w-2/3">
					<div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-background">
						<div className="mb-4 text-3xl font-semibold text-light-green dark:text-dark-green">
							Badges
						</div>
						{/* <section className="w-full py-12 md:py-16 lg:py-20">
							<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
								{sortedBadges.map((badge: BadgeClass) => {
									return (
										<Link
											to={badge.openBadgeId}
											target="_blank"
											rel="noopener noreferrer"
											key={badge.entityId}
										>
											<div
												className={cn(
													'flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 dark:border-gray-800 dark:text-dark-text',
													userBackpack.some((obj: MyBadge | null) => {
														return (
															obj !== null &&
															obj.badgeclass === badge.entityId &&
															!obj.revoked
														)
													})
														? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
														: 'bg-gray-100 dark:bg-dark-boxes',
												)}
											>
												<img
													alt="Design"
													className="h-6 w-6 rounded-full"
													height={24}
													src={badge.image}
													style={{
														aspectRatio: '24/24',
														objectFit: 'cover',
													}}
													width={24}
												/>
												<span className="text-sm font-medium">
													{badge.name}
												</span>
											</div>
										</Link>
									)
								})}
							</div>
						</section> */}
					</div>
					<div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-background">
						{profile?.user?.devices && (
							<>
								<div className="mb-4 text-3xl font-semibold text-light-green dark:text-dark-green">
									Devices
								</div>
								<DataTable columns={columns} data={profile?.user.devices} />
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<div className="flex w-full items-center justify-center">
			<ErrorMessage />
		</div>
	)
}
