import { redirect, type LoaderFunctionArgs } from 'react-router' 
import { userNameToURl } from '~/lib/user-service.server'
import { getUser } from '~/utils/session.server'

export async function loader({ request }: LoaderFunctionArgs) {
	const user = await getUser(request)

	if (!user) {
		return redirect('/explore/login')
	} else {
		return redirect('/profile/' + userNameToURl(user.name))
	}
}
