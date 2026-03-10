import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  type ActionFunctionArgs,
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
} from 'react-router'
import Home from '~/components/header/home'
import { Separator } from '~/components/ui/separator'
import { claimBox } from '~/lib/transfer-service.server'
import { getUserId } from '~/utils/session.server'

type ActionData = {
  success: boolean
  message?: string
  error?: string
  claimedBoxId?: string
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await getUserId(request)
  if (!userId) return redirect('/')

  const formData = await request.formData()
  const token = formData.get('token')?.toString().trim()

  if (!token) {
    return { success: false, error: 'Please enter a transfer token.' } satisfies ActionData
  }

  try {
    const result = await claimBox(userId, token)
    return { success: true, message: result.message, claimedBoxId: result.boxId } satisfies ActionData
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to claim device.',
    } satisfies ActionData
  }
}

export default function DeviceTransfer() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const { t } = useTranslation('profile')
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div>
      <div className="pointer-events-none z-10 flex h-14 w-full p-2">
        <Home />
      </div>

      <div className="mx-auto max-w-5xl space-y-6 p-10 pb-14 font-helvetica">
        <div className="rounded text-[#676767]">
          <ArrowLeft className="mr-2 inline h-5 w-5" />
          <Link to="/profile/me">{t('back_to_dashboard')}</Link>
        </div>

        <div className="space-y-0.5">
          <h2 className="text-3xl font-bold tracking-normal">{t('transfer_device')}</h2>
          <p className="text-muted-foreground">{t('import_device')}</p>
        </div>
        <Separator />

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-dark-boxes">
          <h3 className="mb-2 text-lg font-semibold dark:text-dark-text">
            {t('take_over_device')}
          </h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
            {t('enter_transfer_token')}
          </p>

          <Form method="post" replace className="flex flex-col gap-3">
            <input
              name="token"
              type="text"
              placeholder={t('example_token')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-base dark:border-gray-600 dark:bg-dark-background dark:text-dark-text"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md w-60 bg-light-green px-4 py-2 text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-dark-green"
            >
              {isSubmitting ? t('taking_over') : t('take_over_device')}
            </button>
          </Form>

          {actionData?.error && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {actionData.error}
            </div>
          )}
          {actionData?.success && (
            <div className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {actionData.message ?? t('device_successfully_claimed')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}