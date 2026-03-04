import { CheckLine, OctagonAlert } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Form,
	useActionData,
	useFetcher,
	useLoaderData,
	data,
	redirect,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from 'react-router'
import invariant from 'tiny-invariant'
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { useToast } from '~/components/ui/use-toast'
import { resendEmailConfirmation } from '~/lib/user-service.server'
import {
	getUserById,
	updateUserEmail,
	updateUserName,
	updateUserlocale,
	verifyLogin,
	getUserByAnyEmail,
} from '~/models/user.server'
import { getUserId } from '~/utils/session.server'

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const user = await getUserById(userId)
	if (!user) return redirect('/')

	return user
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	const intent = String(formData.get('intent') ?? '')

	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const user = await getUserById(userId)
	if (!user) return redirect('/')

	if (intent === 'resend-verification') {
		try {
			const result = await resendEmailConfirmation(user)
			if (result === 'already_confirmed') {
				return data({ intent, code: 'UnprocessableContent' }, { status: 422 })
			}
			return data({ intent, code: 'Ok' }, { status: 200 })
		} catch (err) {
			console.warn(err)
			return data({ intent, code: 'Error' }, { status: 500 })
		}
	}

	const name = String(formData.get('name') ?? '').trim()
	const email = String(formData.get('email') ?? '').trim()
	const language = String(formData.get('language') ?? '').trim()
	const currentPassword = String(formData.get('passwordUpdate') ?? '')

	invariant(typeof name === 'string', 'name must be a string')
	invariant(typeof email === 'string', 'email must be a string')
	invariant(typeof language === 'string', 'language must be a string')
	invariant(typeof currentPassword === 'string', 'password must be a string')

	const pendingEmail = (user.unconfirmedEmail ?? '').trim()
	const hasPendingEmail = pendingEmail.length > 0

	const wantsEmailChange =
		email.length > 0 &&
		((hasPendingEmail && email !== pendingEmail) ||
			(!hasPendingEmail && email !== user.email))

	const wantsNameChange = name.length > 0 && name !== user.name
	const wantsLanguageChange = language.length > 0 && language !== user.language

	const wantsAnyChange = wantsNameChange || wantsLanguageChange || wantsEmailChange

	if (!wantsAnyChange) {
		return data(
			{
				intent: 'update-profile',
				errors: { name: null, email: null, passwordUpdate: null },
			},
			{ status: 200 },
		)
	}

	if (wantsEmailChange) {
		if (!currentPassword) {
			return data(
				{
					intent: 'update-profile',
					errors: {
						name: null,
						email: null,
						passwordUpdate: 'Password is required to change email',
					},
				},
				{ status: 400 },
			)
		}

		const ok = await verifyLogin(user.email, currentPassword)
		if (!ok) {
			return data(
				{
					intent: 'update-profile',
					errors: {
						name: null,
						email: null,
						passwordUpdate: 'Invalid password',
					},
				},
				{ status: 400 },
			)
		}

		const existing = await getUserByAnyEmail(email)
		if (existing && existing.id !== user.id) {
			return data(
				{
					intent: 'update-profile',
					errors: { name: null, email: 'Email already in use', passwordUpdate: null },
				},
				{ status: 409 },
			)
		}

	}

	if (wantsNameChange) {
		await updateUserName(user.email, name)
	}

	if (wantsLanguageChange) {
		await updateUserlocale(user.email, language)
	}

	if (wantsEmailChange) {
		const [updatedUser] = await updateUserEmail(user, email)

		await resendEmailConfirmation(updatedUser)
	}

	return data(
		{
			intent: 'update-profile',
			errors: { name: null, email: null, passwordUpdate: null },
		},
		{ status: 200 },
	)
}

export default function EditUserProfilePage() {
	const userData = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const fetcher = useFetcher<typeof action>()
	const { toast } = useToast()
	const { t } = useTranslation('settings')

	const passwordUpdRef = useRef<HTMLInputElement>(null)

	const { pendingEmail, hasPendingEmail, emailShown, showConfirmed } = useMemo(() => {
		const pending = (userData?.unconfirmedEmail ?? '').trim()
		const hasPending = pending.length > 0
		const shown = hasPending ? pending : (userData?.email ?? '')
		const confirmed = Boolean(userData?.emailIsConfirmed) && !hasPending
		return {
			pendingEmail: pending,
			hasPendingEmail: hasPending,
			emailShown: shown,
			showConfirmed: confirmed,
		}
	}, [userData])

	const [name, setName] = useState(userData?.name ?? '')
	const [email, setEmail] = useState(emailShown)
	const [lang, setLang] = useState(userData?.language ?? 'en_US')

	useEffect(() => {
		setName(userData?.name ?? '')
		setLang(userData?.language ?? 'en_US')
		setEmail(emailShown)
	}, [userData, emailShown])

	useEffect(() => {
		if (!actionData || actionData.intent !== 'update-profile') return
		if (!('errors' in actionData)) return

		if (actionData.errors?.passwordUpdate) {
			toast({ title: t('invalid_password'), variant: 'destructive' })
			passwordUpdRef.current?.focus()
			return
		}

		if (actionData.errors?.email) {
			toast({ title: String(actionData.errors.email), variant: 'destructive' })
			return
		}

		toast({ title: t('profile_successfully_updated'), variant: 'success' })
	}, [actionData, toast, t])

	useEffect(() => {
		if (fetcher.state !== 'idle' || !fetcher.data) return
		if (fetcher.data.intent !== 'resend-verification') return
		if (!('code' in fetcher.data)) return

		const { code } = fetcher.data
		if (code === 'Ok') {
			toast({ title: t('verification_email_sent'), variant: 'success' })
		} else if (code === 'UnprocessableContent') {
			toast({ title: t('email_already_confirmed'), variant: 'default' })
		} else {
			toast({ title: t('verification_email_failed'), variant: 'destructive' })
		}
	}, [fetcher.state, fetcher.data, toast, t])

	const saveDisabled =
		name === (userData?.name ?? '') &&
		lang === (userData?.language ?? 'en_US') &&
		email.trim() === emailShown.trim()

	return (
		<Form method="post" className="space-y-6" noValidate>
			<Card className="dark:border-white dark:bg-dark-boxes">
				<CardHeader>
					<CardTitle>{t('account_information')}</CardTitle>
					<CardDescription>{t('update_basic_details')}</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-6">
					<div className="grid gap-2">
						<Label htmlFor="name">{t('name')}</Label>
						<Input
							id="name"
							required
							name="name"
							type="text"
							placeholder={t('enter_name')}
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="email">{t('email')}</Label>
						<Input
							id="email"
							name="email"
							placeholder={t('enter_email')}
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>

						{showConfirmed ? (
							<p className="flex items-center gap-1 text-sm text-green-500 dark:text-green-300">
								<span className="inline-flex gap-1">
									<CheckLine /> {t('email_confirmed')}
								</span>
							</p>
						) : (
							<div className="flex items-center justify-between gap-3">
								<p className="flex items-center gap-1 text-sm text-orange-500 dark:text-amber-400">
									<span className="inline-flex gap-1">
										<OctagonAlert />{' '}
										{hasPendingEmail
											? t('email_not_confirmed')
											: t('email_not_confirmed')}
									</span>
								</p>

								<Button
									type="button"
									variant="default"
									size="sm"
									disabled={fetcher.state === 'submitting'}
									onClick={() => {
										void fetcher.submit(
											{ intent: 'resend-verification' },
											{ method: 'post' },
										)
									}}
								>
									{fetcher.state === 'submitting'
										? t('sending')
										: t('resend_verification')}
								</Button>
							</div>
						)}

						{hasPendingEmail ? (
							<p className="text-sm text-muted-foreground">
								{t('email_change_pending_hint', {
									pendingEmail,
									currentEmail: userData?.email ?? '',
								})}
							</p>
						) : null}
					</div>

					<div className="grid gap-2">
						<Label htmlFor="language">{t('language')}</Label>
						<Select value={lang} onValueChange={setLang} name="language">
							<SelectTrigger className="dark:border-white">
								<SelectValue placeholder={t('select_language')} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="en_US">English</SelectItem>
								<SelectItem value="de_DE">Deutsch</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="passwordUpdate">{t('confirm_password')}</Label>
						<Input
							autoComplete="current-password"
							ref={passwordUpdRef}
							id="passwordUpdate"
							placeholder={t('enter_current_password')}
							type="password"
							name="passwordUpdate"
						/>
					</div>
				</CardContent>

				<CardFooter>
					<Button type="submit" disabled={saveDisabled}>
						{t('save_changes')}
					</Button>
				</CardFooter>
			</Card>
		</Form>
	)
}