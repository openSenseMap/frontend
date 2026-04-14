import { redirect, type LoaderFunctionArgs } from 'react-router'
import { confirmEmail } from '~/lib/user-service.server'
import { getUserSession, authSessionStorage } from '~/utils/session.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return redirect('/settings/account?emailConfirm=missing_params')
  }

  const updated = await confirmEmail(token)

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