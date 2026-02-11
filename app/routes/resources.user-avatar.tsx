import { useEffect } from 'react'
import { type LoaderFunctionArgs, useFetcher } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { getProfileByUserId } from '~/models/profile.server'
import { getInitials } from '~/utils/misc'
import { requireUser } from '~/utils/session.server'

export async function loader({ request }: LoaderFunctionArgs) {
	const user = await requireUser(request)
	const profile = await getProfileByUserId(user.id)

	if (!user || !profile) {
		throw new Error()
	}

	return { user, profile }
}

export function UserAvatar() {
	const fetcher = useFetcher<typeof loader>()

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data == null) {
			void fetcher.load('/resources/user-avatar')
		}
	}, [fetcher])

	return (
		<Avatar className="h-8 w-8">
			<AvatarImage
				className="aspect-auto h-full w-full rounded-full object-cover"
				src={'/resources/file/' + fetcher.data?.profile?.profileImage?.id}
				alt={fetcher.data?.profile.username}
			/>
			<AvatarFallback>
				{getInitials(fetcher.data?.profile?.username ?? '')}
			</AvatarFallback>
		</Avatar>
	)
}
