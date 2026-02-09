import { InfoIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Form,
	Link,
	Outlet,
	useActionData, // useFormAction,
	// useNavigation,
	useLoaderData,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from 'react-router'
import ErrorMessage from '~/components/error-message'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { useToast } from '~/components/ui/use-toast'
import { getProfileByUserId, updateProfile } from '~/models/profile.server'
import { getInitials } from '~/utils/misc'
import { requireUserId } from '~/utils/session.server'

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const profile = await getProfileByUserId(userId)
	if (!profile) {
		// throw await authenticator.logout(request, { redirectTo: "/" });
		throw new Error()
	}
	return { profile }
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const profile = await getProfileByUserId(userId)
	const formData = await request.formData()
	const username = formData.get('username')
	const isPublic = formData.get('isPublic')

	if (!profile || !userId) {
		return {
			success: false,
			message: 'Something went wrong.',
		}
	}

	const updatedProfile = await updateProfile(
		profile?.id as string,
		username as string,
		isPublic === 'on',
	)

	return {
		success: true,
		updatedProfile,
	}
}

export default function EditUserProfilePage() {
	const data = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()

	const [username, setUsername] = useState(data.profile.username)
	const [isPublic, setIsPublic] = useState(data.profile.public || false)

	const { t } = useTranslation('settings')

	//* toast
	const { toast } = useToast()

	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast({
					title: t('profile_updated'),
					description: t('profile_updated_description'),
					variant: 'success',
				})
			} else {
				toast({
					title: t('something_went_wrong'),
					description: t('something_went_wrong_description'),
					variant: 'destructive',
				})
			}
		}
	}, [actionData, toast])

	return (
		<Form method="post">
			<Card className="space-y-6 dark:border-white dark:bg-dark-boxes">
				<CardHeader>
					<CardTitle>{t('profile_settings')}</CardTitle>
					<CardDescription>{t('profile_settings_description')}</CardDescription>
				</CardHeader>
				<CardContent className="flex">
					<div className="w-1/2 justify-center space-y-6">
						<div className="space-y-2">
							<div className="flex items-center space-x-2">
								<Label htmlFor="username">{t('username')}</Label>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<InfoIcon className="h-4 w-4 text-muted-foreground" />
										</TooltipTrigger>
										<TooltipContent>
											<p>{t('if_public')}</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
							<Input
								min={3}
								max={40}
								type="text"
								id="username"
								name="username"
								placeholder={t('enter_username')}
								defaultValue={username}
								onChange={(e) => setUsername(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<div className="flex items-center space-x-2">
								<Label htmlFor="isPublic">{t('public_profile')}</Label>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<InfoIcon className="h-4 w-4 text-muted-foreground" />
										</TooltipTrigger>
										<TooltipContent>
											<p>
												{t('if_activated_public_1')}{' '}
												<Link to="/profile/me" target="__blank">
													<span className="underline">
														{t('if_activated_public_2')}
													</span>
												</Link>
												{t('if_activated_public_3')}
											</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
							<Switch
								id="isPublic"
								name="isPublic"
								defaultChecked={isPublic}
								onCheckedChange={(e) => setIsPublic(e)}
							/>
						</div>
					</div>
					<div className="flex w-1/2 justify-center">
						<div className="relative h-52 w-52">
							<Avatar className="h-full w-full">
								<AvatarImage
									className="aspect-auto h-full w-full rounded-full object-cover"
									src={'/resources/file/' + data.profile.profileImage?.id}
								/>
								<AvatarFallback>
									{getInitials(data.profile?.username ?? '')}
								</AvatarFallback>
							</Avatar>
							<Link
								preventScrollReset
								to="photo"
								className="border-night-700 bg-night-500 pointer-events-auto absolute -right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full border-4 p-5"
								title={t('change_profile_photo')}
								aria-label={t('change_profile_photo')}
							>
								&#x270E;
							</Link>
						</div>
					</div>
				</CardContent>
				<CardFooter>
					<Button
						type="submit"
						disabled={
							username === data.profile.username &&
							isPublic === data.profile.public
						}
					>
						{t('save_changes')}
					</Button>
				</CardFooter>
				<Outlet />
			</Card>
		</Form>
	)
}

export function ErrorBoundary() {
	return (
		<div className="flex h-full w-full items-center justify-center">
			<ErrorMessage />
		</div>
	)
}
