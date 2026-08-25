import * as React from 'react'
import { useTranslation } from 'react-i18next'
import 'altcha/i18n/de'
import 'altcha'
import type {} from 'altcha/types/react'
import {
	data,
	redirect,
	Form,
	Link,
	useActionData,
	useNavigation,
	useSearchParams,
} from 'react-router'
import { type Route } from './+types/explore.register'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { ClientOnly } from '~/components/client-only'
import { getCurrentEffectiveTos } from '~/db/models/tos.server'
import { verifyAndRedeemRegistrationChallenge } from '~/lib/altcha.server'
import { getLocale } from '~/middleware/i18next'
import { createUserSession, getUserId } from '~/services/session-service.server'
import { registerUser } from '~/services/user-service.server'
import { safeRedirect, validateEmail, validateName } from '~/utils'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await getUserId(request)
	if (userId) return redirect('/')
	return {}
}

type RegistrationErrorField =
	| 'username'
	| 'email'
	| 'password'
	| 'tosAccepted'
	| 'altcha'
	| 'form'

function registrationError(
	field: RegistrationErrorField,
	code: string,
	options: { status?: number; challengeRedeemed?: boolean } = {},
) {
	const errors: Record<RegistrationErrorField, string | null> = {
		username: null,
		email: null,
		password: null,
		tosAccepted: null,
		altcha: null,
		form: null,
	}
	errors[field] = code

	return data(
		{
			errors,
			challengeRedeemed: options.challengeRedeemed ?? false,
		},
		{ status: options.status ?? 400 },
	)
}

export async function action({ context, request }: Route.ActionArgs) {
	const formData = await request.formData()
	const { username, email, password, tosAccepted, newsletterOptIn, altcha } =
		Object.fromEntries(formData)
	const redirectTo = safeRedirect(formData.get('redirectTo'), '/explore')

	if (!username || typeof username !== 'string') {
		return registrationError('username', 'username_required')
	}

	//* Validate userName
	const validateUserName = validateName(username?.toString())
	if (!validateUserName.isValid) {
		return registrationError(
			'username',
			validateUserName.errorMsg ?? 'username_invalid',
		)
	}

	if (!validateEmail(email)) {
		return registrationError('email', 'email_invalid')
	}

	if (typeof password !== 'string' || password.length === 0) {
		return registrationError('password', 'password_required')
	}

	if (password.length < 8) {
		return registrationError('password', 'password_too_short')
	}

	if (tosAccepted !== 'on') {
		return registrationError('tosAccepted', 'tos_must_accept')
	}

	const challengeVerified = await verifyAndRedeemRegistrationChallenge(altcha)
	if (!challengeVerified) {
		return registrationError('altcha', 'altcha_verification_failed')
	}

	const tos = await getCurrentEffectiveTos()
	if (!tos) {
		return registrationError('tosAccepted', 'tos_unavailable', {
			status: 500,
			challengeRedeemed: true,
		})
	}

	//* get current locale
	const locale = getLocale(context)
	const language = locale === 'de' ? 'de_DE' : 'en_US'

	const result = await registerUser(
		username,
		email,
		password,
		language,
		tosAccepted === 'on',
		newsletterOptIn === 'on',
	)

	if (!result.ok) {
		const field = result.field === 'tos' ? 'tosAccepted' : result.field
		return registrationError(field, result.code, { challengeRedeemed: true })
	}

	if (!result.emailSent) {
		return data({ emailDeliveryFailed: true }, { status: 200 })
	}

	return createUserSession({
		request,
		userId: result.user.id,
		remember: false,
		redirectTo,
	})
}

export default function RegisterDialog() {
	const { t, i18n } = useTranslation('register')
	const navigation = useNavigation()
	const [searchParams] = useSearchParams()
	const actionData = useActionData<typeof action>()
	const usernameRef = React.useRef<HTMLInputElement>(null)
	const emailRef = React.useRef<HTMLInputElement>(null)
	const passwordRef = React.useRef<HTMLInputElement>(null)
	const altchaRef = React.useRef<HTMLElementTagNameMap['altcha-widget']>(null)

	React.useEffect(() => {
		if (actionData && 'errors' in actionData) {
			if (actionData.challengeRedeemed || actionData.errors.altcha) {
				altchaRef.current?.reset()
			}

			if (actionData.errors?.username) {
				usernameRef.current?.focus()
			} else if (actionData.errors?.email) {
				emailRef.current?.focus()
			} else if (actionData.errors?.password) {
				passwordRef.current?.focus()
			} else if (actionData.errors?.altcha) {
				altchaRef.current?.focus()
			}
		}
	}, [actionData])

	const actionErrors =
		actionData && 'errors' in actionData ? actionData.errors : undefined

	if (
		actionData &&
		'emailDeliveryFailed' in actionData &&
		actionData.emailDeliveryFailed
	) {
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
					<CardHeader>
						<CardTitle className="text-2xl font-bold">
							{t('account_created')}
						</CardTitle>
						<CardDescription>
							{t('email_delivery_failed_description')}
						</CardDescription>
					</CardHeader>
					<CardFooter className="flex flex-col items-center gap-2">
						<Link to="/explore/login" className="w-full">
							<Button className="bg-light-blue w-full">
								{t('go_to_login')}
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
				{navigation.state === 'loading' && (
					<div className="absolute inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-xs dark:bg-zinc-800/30">
						<Spinner />
					</div>
				)}
				<Form method="post" className="space-y-6">
					<CardHeader>
						<CardTitle className="text-2xl font-bold">
							{t('register')}
						</CardTitle>
						<CardDescription>{t('create_account')}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="username">{t('username')}</Label>
							<Input
								id="username"
								placeholder={t('enter_username')}
								ref={usernameRef}
								name="username"
								type="text"
								autoFocus={true}
							/>
							<p className="text-muted-foreground text-xs">
								{t('username_hint')}
							</p>
							{actionErrors?.username && (
								<div className="mt-1 text-sm text-red-500" id="password-error">
									{t(actionErrors?.username)}
								</div>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">{t('email')}</Label>
							<Input
								id="email"
								type="email"
								placeholder={t('enter_email')}
								ref={emailRef}
								required
								autoFocus={true}
								name="email"
								autoComplete="email"
								aria-invalid={actionErrors?.email ? true : undefined}
								aria-describedby="email-error"
							/>
							{actionErrors?.email && (
								<div className="mt-1 text-sm text-red-500" id="email-error">
									{t(actionErrors?.email)}
								</div>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">{t('password')}</Label>
							<Input
								id="password"
								type="password"
								placeholder={t('enter_password')}
								ref={passwordRef}
								name="password"
								autoComplete="new-password"
								aria-invalid={actionErrors?.password ? true : undefined}
								aria-describedby="password-error"
							/>
							<p className="text-muted-foreground text-xs">
								{t('password_hint')}
							</p>
							{actionErrors?.password && (
								<div className="mt-1 text-sm text-red-500" id="password-error">
									{t(actionErrors?.password)}
								</div>
							)}
						</div>
						<div className="space-y-2">
							<ClientOnly
								fallback={
									<div
										className="text-muted-foreground flex min-h-16 items-center text-sm"
										aria-busy="true"
									>
										{t('altcha_loading')}
									</div>
								}
							>
								{() => (
									<altcha-widget
										ref={altchaRef}
										challenge="/api/altcha/challenge"
										configuration={JSON.stringify({
											validationMessage: t('altcha_required'),
										})}
										language={i18n.language.startsWith('de') ? 'de' : 'en'}
										name="altcha"
										workers={2}
										style={{ '--altcha-max-width': '100%', width: '100%' }}
									/>
								)}
							</ClientOnly>
							{actionErrors?.altcha && (
								<div className="mt-1 text-sm text-red-500" id="altcha-error">
									{t(actionErrors.altcha)}
								</div>
							)}
						</div>
						<div className="flex items-center gap-2">
							<Checkbox
								id="tosAccepted"
								name="tosAccepted"
								value="on"
								aria-invalid={actionErrors?.tosAccepted ? true : undefined}
								aria-describedby="tos-error"
							/>
							<Label htmlFor="tosAccepted" className="text-sm leading-5">
								{t('agree_tos_prefix')}{' '}
								<Link
									to="/terms"
									className="underline"
									target="_blank"
									rel="noreferrer"
								>
									{t('terms_of_service')}
								</Link>{' '}
								{t('agree_tos_suffix')}
							</Label>
						</div>
						<div className="flex items-center gap-2">
							<Checkbox
								id="newsletterOptIn"
								name="newsletterOptIn"
								value="on"
							/>
							<Label htmlFor="newsletterOptIn" className="text-sm leading-5">
								{t('newsletter_opt_in')}
							</Label>
						</div>
						<div className="flex items-center gap-2">
							<Label className="text-sm leading-5">
								{t('privacy_policy_prefix')}{' '}
								<Link
									to="/privacy"
									className="underline"
									target="_blank"
									rel="noreferrer"
								>
									{t('privacy_policy')}
								</Link>
								{'.'}
							</Label>
						</div>

						{actionErrors?.tosAccepted && (
							<div className="mt-1 text-sm text-red-500" id="tos-error">
								{t(actionErrors?.tosAccepted)}
							</div>
						)}
						{actionErrors?.form && (
							<div className="mt-1 text-sm text-red-500" role="alert">
								{t(actionErrors.form)}
							</div>
						)}
					</CardContent>
					<CardFooter className="flex flex-col items-center gap-2">
						<Button className="bg-light-blue w-full">{t('register')}</Button>
						<div className="text-muted-foreground text-sm">
							{t('already_account')}{' '}
							<Link to="/explore/login" className="underline">
								{t('login')}
							</Link>
						</div>
					</CardFooter>
				</Form>
			</Card>
		</div>
	)
}
