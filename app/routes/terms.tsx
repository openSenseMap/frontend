import * as React from 'react'
import {
  Form,
  data,
  redirect,
  useActionData,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router'
import { Button } from '~/components/ui/button'
import {
  acceptCurrentTosViaEmailFlow,
  getActiveTosAcceptanceTokenById,
  getCurrentEffectiveTos,
  getTosRequirementForUser,
} from '~/models/tos.server'
import {
  getTosFlowSession,
  tosFlowSessionStorage,
} from '~/utils/tos-session.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const tos = await getCurrentEffectiveTos()

  const session = await getTosFlowSession(request)
  const tokenId = session.get('tokenId')
  const userId = session.get('userId')


  let canAcceptViaEmail = false
  let info:
    | 'accepted'
    | 'already_accepted'
    | 'invalid'
    | 'missing'
    | 'not_configured'
    | null = null

  const tosLink = url.searchParams.get('tosLink')
  if (
    tosLink === 'accepted' ||
    tosLink === 'already_accepted' ||
    tosLink === 'invalid' ||
    tosLink === 'missing' ||
    tosLink === 'not_configured'
  ) {
    info = tosLink
  }

  let headers: HeadersInit | undefined

  if (tokenId && userId) {
    const token = await getActiveTosAcceptanceTokenById(tokenId, userId)

    if (!token) {
      headers = {
        'Set-Cookie': await tosFlowSessionStorage.destroySession(session),
      }
      info ??= 'invalid'
    } else {
      const req = await getTosRequirementForUser(userId)
      canAcceptViaEmail = !!req.tos && !req.accepted

      if (req.accepted) {
        headers = {
          'Set-Cookie': await tosFlowSessionStorage.destroySession(session),
        }
        info ??= 'already_accepted'
      }
    }
  }

  if (!tos) {
    return data(
      { tos: null, canAcceptViaEmail: false, info: info ?? 'not_configured' },
      { status: 500, headers },
    )
  }

  return data({ tos, canAcceptViaEmail, info }, { headers })
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()

  if (formData.get('intent') !== 'accept_tos_from_email') {
    return data({ error: 'invalid_intent' }, { status: 400 })
  }

  if (formData.get('accepted') !== 'on') {
    return data({ error: 'tos_must_accept' }, { status: 400 })
  }

  const session = await getTosFlowSession(request)
  const tokenId = session.get('tokenId')
  const userId = session.get('userId')
  console.log("token", tokenId)
  console.log("userId", userId)

  if (!tokenId || !userId) {
    return data({ error: 'invalid_or_expired_link' }, { status: 403 })
  }

  const result = await acceptCurrentTosViaEmailFlow({ tokenId, userId })
  console.log("result", result)

  if (result === 'not_configured') {
    return data({ error: 'not_configured' }, { status: 500 })
  }

  if (result !== 'success') {
    return data({ error: 'invalid_or_expired_link' }, { status: 403 })
  }

  return redirect('/terms?tosLink=accepted', {
    headers: {
      'Set-Cookie': await tosFlowSessionStorage.destroySession(session),
    },
  })
}

export default function TermsPage() {
  const { tos, canAcceptViaEmail, info } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const [checked, setChecked] = React.useState(false)

  if (!tos) return <div className="p-6">No ToS configured.</div>

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">{tos.title}</h1>

      {info === 'accepted' && (
        <div className="rounded-md border border-green-300 bg-green-50 p-3 text-sm">
          Thank you. You have successfully accepted the Terms of Service.
        </div>
      )}

      {info === 'already_accepted' && (
        <div className="rounded-md border border-blue-300 bg-blue-50 p-3 text-sm">
          These Terms of Service were already accepted for your account.
        </div>
      )}

      {info === 'invalid' && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm">
          This acceptance link is invalid or expired.
        </div>
      )}

      {info === 'missing' && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm">
          No acceptance token was provided.
        </div>
      )}

      <div className="prose max-w-none whitespace-pre-wrap">{tos.body}</div>

      {canAcceptViaEmail && (
        <Form method="post" className="space-y-4 border-t pt-6">
          <input type="hidden" name="intent" value="accept_tos_from_email" />

          <div className="flex items-start gap-2">
            <input
              id="accepted"
              name="accepted"
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <label htmlFor="accepted" className="text-sm leading-5">
              I have read and accept the current Terms of Service.
            </label>
          </div>

          {actionData?.error === 'tos_must_accept' && (
            <div className="text-sm text-red-500">
              Please confirm that you accept the Terms of Service.
            </div>
          )}

          {actionData?.error === 'invalid_or_expired_link' && (
            <div className="text-sm text-red-500">
              This acceptance link is invalid or expired.
            </div>
          )}

          {actionData?.error === 'not_configured' && (
            <div className="text-sm text-red-500">
              No Terms of Service are currently configured.
            </div>
          )}

          <Button type="submit" disabled={!checked}>
            Accept Terms of Service
          </Button>
        </Form>
      )}
    </div>
  )
}