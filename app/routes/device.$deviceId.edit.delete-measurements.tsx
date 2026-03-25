import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	Form,
	data,
	redirect,
	useActionData,
	useLoaderData,
} from 'react-router'
import invariant from 'tiny-invariant'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { getUserDevice } from '~/models/device.server'
import { deleteMeasurementsForDevice } from '~/models/measurement.server'
import { verifyLogin } from '~/models/user.server'
import { getUserEmail, getUserId } from '~/utils/session.server'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const deviceId = params.deviceId
	invariant(typeof deviceId === 'string', 'Device id not found.')

	const device = await getUserDevice({ id: deviceId, userId: userId })
	if (!device) return redirect('/profile/me')

	return data({ device })
}

export async function action({ request, params }: ActionFunctionArgs) {
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const deviceId = params.deviceId
	invariant(typeof deviceId === 'string', 'Device id not found.')

	const device = await getUserDevice({ id: deviceId, userId: userId })
	if (!device) return redirect('/profile/me')

	const formData = await request.formData()
	const passwordConfirm = formData.get('passwordConfirm')
	invariant(typeof passwordConfirm === 'string', 'password must be a string')

	const userEmail = await getUserEmail(request)
	invariant(typeof userEmail === 'string', 'email not found')

	const user = await verifyLogin(userEmail, passwordConfirm)
	if (!user) {
		return data(
			{
				success: false,
				noMeasurements: false,
				errors: { passwordConfirm: 'Invalid password' } as { passwordConfirm: string } | null,
			},
			{ status: 400 },
		)
	}

	const result = await deleteMeasurementsForDevice(deviceId)

	return data({
		success: true,
		noMeasurements: result.count === 0,
		errors: null as { passwordConfirm: string } | null,
	})
}

export default function DeleteMeasurementsPage() {
	const { device } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const passwordRef = React.useRef<HTMLInputElement>(null)
	const [password, setPassword] = React.useState('')

	const { t } = useTranslation('delete-measurements')

	React.useEffect(() => {
		if (actionData?.errors?.passwordConfirm) {
			passwordRef.current?.focus()
		}
		if (actionData?.success) {
			setPassword('')
		}
	}, [actionData])

	return (
		<Form method="post" className="space-y-6" noValidate>
			<Card className="dark:border-white dark:bg-dark-boxes">
				<CardHeader>
					<CardTitle className="text-red-600">
						{t('delete_measurements')}
					</CardTitle>
					<CardDescription>
						<Trans
							t={t}
							i18nKey="confirm_permanent_deletion"
							values={{ device: device.name }}
							components={{ b: <b /> }}
						/>
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-4">
					{actionData?.success && !actionData.noMeasurements && (
						<div className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400">
							{t('delete_success')}
						</div>
					)}

					{actionData?.success && actionData.noMeasurements && (
						<div className="rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-700 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
							{t('no_measurements')}
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="passwordConfirm">{t('password')}</Label>
						<Input
							id="passwordConfirm"
							name="passwordConfirm"
							type="password"
							ref={passwordRef}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
						{actionData?.errors?.passwordConfirm && (
							<div className="text-sm text-red-500">
								{actionData.errors.passwordConfirm}
							</div>
						)}
					</div>

					<Button type="submit" variant="destructive" disabled={!password}>
						{t('delete_measurements')}
					</Button>
				</CardContent>
			</Card>
		</Form>
	)
}
