import { useEffect, useRef, useState } from 'react'
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
import {
	getUserByEmail,
	updateUserName,
	updateUserlocale,
	verifyLogin,
} from '~/models/user.server'
import { getUserEmail, getUserId } from '~/utils/session.server'

//*****************************************************
export async function loader({ request }: LoaderFunctionArgs) {
	// If user is not logged in, redirect to home
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	// Get user email and load user data
	const userEmail = await getUserEmail(request)
	invariant(userEmail, `Email not found!`)
	const userData = await getUserByEmail(userEmail)
	return userData
}

//*****************************************************
export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	const { name, passwordUpdate, email, language } = Object.fromEntries(formData)
	const errors = {
		name: name ? null : 'Invalid name',
		email: email ? null : 'Invalid email',
		passwordUpdate: passwordUpdate ? null : 'Password is required',
	}

	invariant(typeof name === 'string', 'name must be a string')
	invariant(typeof email === 'string', 'email must be a string')
	invariant(typeof passwordUpdate === 'string', 'password must be a string')
	invariant(typeof language === 'string', 'language must be a string')

	// Validate password
	if (errors.passwordUpdate) {
		return data(
			{
				errors: {
					name: null,
					email: null,
					passwordUpdate: errors.passwordUpdate,
				},
				status: 400,
			},
			{ status: 400 },
		)
	}

	const user = await verifyLogin(email, passwordUpdate)
	// If password is invalid
	if (!user) {
		return data(
			{
				errors: {
					name: null,
					email: null,
					passwordUpdate: 'Invalid password',
				},
			},
			{ status: 400 },
		)
	}

	// Update locale and name
	await updateUserlocale(email, language)
	await updateUserName(email, name)

	// Return success response
	return data(
		{
			errors: {
				name: null,
				email: null,
				passwordUpdate: null,
			},
		},
		{ status: 200 },
	)
}

//*****************************************************
export default function EditUserProfilePage() {
	const userData = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const fetcher = useFetcher()
	const [lang, setLang] = useState(userData?.language || 'en_US')
	const [name, setName] = useState(userData?.name || '')
	const passwordUpdRef = useRef<HTMLInputElement>(null)
	const { toast } = useToast()
	const { t } = useTranslation('settings')

	// Handle profile update responses
	useEffect(() => {
		if (actionData && actionData?.errors?.passwordUpdate) {
			toast({
				title: t('invalid_password'),
				variant: 'destructive',
			})
			passwordUpdRef.current?.focus()
		}
		if (actionData && !actionData?.errors?.passwordUpdate) {
			toast({
				title: t('profile_successfully_updated'),
				variant: 'success',
			})
		}
	}, [actionData, toast, t])

	// Handle resend verification response
	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data) {
			if (fetcher.data.code === 'Ok') {
				toast({
					title: t('verification_email_sent'),
					variant: 'success',
				})
			} else if (fetcher.data.code === 'UnprocessableContent') {
				toast({
					title: t('email_already_confirmed'),
					variant: 'default',
				})
			} else {
				toast({
					title: t('verification_email_failed'),
					variant: 'destructive',
				})
			}
		}
	}, [fetcher.state, fetcher.data, toast, t])

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
							defaultValue={name}
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
							defaultValue={userData?.email}
						/>
						{/* Email confirmation status */}
						{userData?.emailIsConfirmed ? (
							<p className="flex items-center gap-1 text-sm text-green-500 dark:text-green-300">
								<span>✓</span> {t('email_confirmed')}
							</p>
						) : (
							<div className="flex items-center justify-between">
								<p className="dark:text-amber-400 flex items-center gap-1 text-sm text-orange-500">
									<span>⚠</span> {t('email_not_confirmed')}
								</p>
								<fetcher.Form
									method="post"
									action="/api/users/me/resend-email-confirmation"
								>
									<Button
										type="submit"
										variant="outline"
										size="sm"
										disabled={fetcher.state === 'submitting'}
									>
										{fetcher.state === 'submitting'
											? t('sending')
											: t('resend_verification')}
									</Button>
								</fetcher.Form>
							</div>
						)}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="language">{t('language')}</Label>
						<Select
							defaultValue={lang}
							onValueChange={(value) => setLang(value)}
							name="language"
						>
							<SelectTrigger className="dark:border-white">
								<SelectValue placeholder={t('select_language')} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="en_US">English</SelectItem>
								<SelectItem value="de_De">Deutsch</SelectItem>
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
					<Button
						type="submit"
						disabled={name === userData?.name && lang === userData?.language}
					>
						{t('save_changes')}
					</Button>
				</CardFooter>
			</Card>
		</Form>
	)
}
