import { redirect, type LoaderFunctionArgs } from 'react-router' // or cloudflare/deno
import { getProfileByUserId } from '~/models/profile.server'
import { getUser } from '~/utils/session.server'

// Redirect to dynamic profile page with logged in user
export async function loader({ request }: LoaderFunctionArgs) {
	const user = await getUser(request)

	if (!user) {
		return redirect('/explore/login')
	} else {
		return redirect('/profile/' + user.name)
	}
}
