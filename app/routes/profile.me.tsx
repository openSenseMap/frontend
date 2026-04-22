import { redirect } from 'react-router'
import { type Route } from './+types/profile.me'
import { userNameToURl } from '~/services/user-service.server'
import { getUser } from '~/services/session-service.server'

export async function loader({ request }: Route.LoaderArgs) {
	const user = await getUser(request)

	if (!user) {
		return redirect('/explore/login')
	} else {
		return redirect('/profile/' + userNameToURl(user.name))
	}
}
