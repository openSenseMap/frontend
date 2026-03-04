import { redirect, type LoaderFunctionArgs } from 'react-router'
import { confirmEmail } from '~/lib/user-service.server'
import { getUserByAnyEmail, getUserByEmail } from '~/models/user.server'
import { getUserSession, authSessionStorage } from '~/utils/session.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  const email = url.searchParams.get('email')

  if (!token || !email) {
    return redirect('/settings/account?emailConfirm=missing_params')
  }

  const updated = await confirmEmail(token, email)

  if (!updated) {
    return redirect('/settings/account?emailConfirm=invalid_or_expired')
  }

  const session = await getUserSession(request)

  return redirect('/settings/account?emailConfirm=ok', {
    headers: {
      'Set-Cookie': await authSessionStorage.commitSession(session),
    },
  })
}

export default function ConfirmEmailRoute() {
  return null
}