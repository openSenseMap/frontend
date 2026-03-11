import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
	Form,
	Link,
	data,
	redirect,
	useActionData,
	useLoaderData,
	useNavigation,
	useSearchParams,
} from 'react-router'

import ErrorMessage from '~/components/error-message'
import Spinner from '~/components/spinner'
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

import { resetPassword } from '~/lib/user-service.server'
import { getUserId } from '~/utils/session.server'

type LoaderData = {
	token: string | null
}

type ActionData = {
	success: boolean
	errors?: {
		token?: string | null
		newPassword?: string | null
		confirmPassword?: string | null
		form?: string | null
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await getUserId(request)
	if (userId) return redirect('/explore')

	const url = new URL(request.url)
	const token = url.searchParams.get('token')

	return data<LoaderData>({ token: token?.trim() || null })
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	const token = formData.get('token')?.toString().trim() ?? ''
	const newPassword = formData.get('newPassword')?.toString() ?? ''
	const confirmPassword = formData.get('confirmPassword')?.toString() ?? ''

	if (!token) {
		return data<ActionData>(
			{ success: false, errors: { token: 'reset_link_invalid' } },
			{ status: 400 },
		)
	}

	if (newPassword.trim().length === 0) {
		return data<ActionData>(
			{ success: false, errors: { newPassword: 'password_required' } },
			{ status: 400 },
		)
	}

	if (newPassword !== confirmPassword) {
		return data<ActionData>(
			{
				success: false,
				errors: {
					confirmPassword: 'passwords_do_not_match',
				},
			},
			{ status: 400 },
		)
	}

	try {
		const result = await resetPassword(token, newPassword)

		if (result === 'success') {
			// You can also redirect to login instead:
			return redirect('/explore/login?passwordReset=1')
			// return data<ActionData>({ success: true }, { status: 200 })
		}

		if (result === 'expired') {
			return data<ActionData>(
				{ success: false, errors: { token: 'reset_link_expired' } },
				{ status: 410 },
			)
		}

		if (result === 'invalid_password_format') {
			return data<ActionData>(
				{ success: false, errors: { newPassword: 'password_invalid_format' } },
				{ status: 400 },
			)
		}

		return data<ActionData>(
			{ success: false, errors: { token: 'reset_link_invalid' } },
			{ status: 403 },
		)
	} catch (err) {
		console.warn(err)
		return data<ActionData>(
			{ success: false, errors: { form: 'generic_error_try_again' } },
			{ status: 500 },
		)
	}
}

export const meta: MetaFunction = () => {
	return [{ title: 'Password reset' }]
}

export default function PasswordResetRoute() {
	const { token } = useLoaderData() as LoaderData
	const actionData = useActionData() as ActionData | undefined
	const navigation = useNavigation()
	const [searchParams] = useSearchParams()
	const { t } = useTranslation('reset-password')

	const newPasswordRef = React.useRef<HTMLInputElement>(null)

	React.useEffect(() => {
		if (actionData?.errors?.newPassword) newPasswordRef.current?.focus()
	}, [actionData])

	const busy =
		navigation.state === 'submitting' || navigation.state === 'loading'

	if (!token) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Link
					to={{
						pathname: '/explore',
						search: searchParams.toString(),
					}}
				>
					<div className="fixed inset-0 z-40 h-full w-full bg-black opacity-25" />
				</Link>

				<Card className="z-50 w-full max-w-md">
					<CardHeader className="space-y-1 text-center">
						<CardTitle className="text-2xl font-bold">
							{t('reset_link_invalid_title')}
						</CardTitle>
						<CardDescription>
							{t('reset_link_invalid_description')}
						</CardDescription>
					</CardHeader>
					<CardFooter className="flex flex-col gap-2">
						<Link to="/explore/login" className="w-full">
							<Button className="w-full bg-light-blue">
								{t('back_to_login')}
							</Button>
						</Link>
						<Link to="/explore/forgot-password" className="w-full">
							<Button variant="outline" className="w-full">
								{t('request_new_reset_link')}
							</Button>
						</Link>
					</CardFooter>
				</Card>
			</div>
		)
	}

	return (
		<div className="flex h-screen items-center justify-center">
			<Link
				to={{
					pathname: '/explore',
					search: searchParams.toString(),
				}}
			>
				<div className="fixed inset-0 z-40 h-full w-full bg-black opacity-25" />
			</Link>

			<Card className="z-50 w-full max-w-md">
				{busy && (
					<div className="absolute inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30">
						<Spinner />
					</div>
				)}

				{actionData?.success ? (
					<div className="w-full max-w-md rounded-md bg-white p-6 text-center shadow-lg dark:bg-zinc-900">
						<h2 className="mb-4 text-2xl font-bold">
							{t('password_reset_success_title')}
						</h2>
						<p className="mb-6">{t('password_reset_success_description')}</p>
						<Link to="/explore/login" className="block">
							<Button className="w-full bg-light-blue">
								{t('back_to_login')}
							</Button>
						</Link>
					</div>
				) : (
					<Form method="post" className="space-y-6" noValidate>
						<CardHeader className="space-y-1 text-center">
							<CardTitle className="text-2xl font-bold">
								{t('set_new_password')}
							</CardTitle>
							<CardDescription>{t('set_new_password_description')}</CardDescription>
						</CardHeader>

						<CardContent className="space-y-4">
							<input type="hidden" name="token" value={token} />

							{actionData?.errors?.token && (
								<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
									{t(actionData.errors.token)}
								</div>
							)}

							{actionData?.errors?.form && (
								<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
									{t(actionData.errors.form)}
								</div>
							)}

							<div className="space-y-2">
								<Label htmlFor="newPassword">{t('new_password_label')}</Label>
								<Input
									ref={newPasswordRef}
									id="newPassword"
									name="newPassword"
									type="password"
									autoComplete="new-password"
									aria-invalid={actionData?.errors?.newPassword ? true : undefined}
									aria-describedby="new-password-error"
								/>
								{actionData?.errors?.newPassword && (
									<div
										className="mt-1 text-sm text-red-500"
										id="new-password-error"
									>
										{t(actionData.errors.newPassword)}
									</div>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="confirmPassword">
									{t('confirm_password_label')}
								</Label>
								<Input
									id="confirmPassword"
									name="confirmPassword"
									type="password"
									autoComplete="new-password"
									aria-invalid={
										actionData?.errors?.confirmPassword ? true : undefined
									}
									aria-describedby="confirm-password-error"
								/>
								{actionData?.errors?.confirmPassword && (
									<div
										className="mt-1 text-sm text-red-500"
										id="confirm-password-error"
									>
										{t(actionData.errors.confirmPassword)}
									</div>
								)}
							</div>

							<p className="text-xs text-muted-foreground">
								{t('password_requirements_hint')}
							</p>
						</CardContent>

						<CardFooter className="flex flex-col items-center gap-2">
							<Button type="submit" className="w-full bg-light-blue">
								{t('set_password_button')}
							</Button>

							<p className="text-sm text-muted-foreground">
								{t('remember_password')}{' '}
								<Link
									className="font-medium underline"
									to={{
										pathname: '/explore/login',
										search: searchParams.toString(),
									}}
								>
									{t('login_label')}
								</Link>
							</p>
						</CardFooter>
					</Form>
				)}
			</Card>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<div className="flex h-screen w-screen items-center justify-center">
			<ErrorMessage />
		</div>
	)
}
