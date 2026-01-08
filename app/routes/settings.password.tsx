import { useEffect, useRef } from 'react'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	data,
	redirect,
	Form,
	useActionData,
} from 'react-router'
import invariant from 'tiny-invariant'
import { useToast } from '@/components/ui/use-toast'
import ErrorMessage from '~/components/error-message'
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
import { updateUserPassword, verifyLogin } from '~/models/user.server'
import { validatePassLength, validatePassType } from '~/utils'
import { getUserEmail, getUserId } from '~/utils/session.server'

//*****************************************************
export async function loader({ request }: LoaderFunctionArgs) {
	//* if user is not logged in, redirect to home
	const userId = await getUserId(request)
	if (!userId) return redirect('/')
	return {}
}

//*****************************************************
export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	const intent = formData.get('intent')
	const currPass = formData.get('currentPassword')
	const newPass = formData.get('newPassword')
	const confirmPass = formData.get('newPasswordConfirm')
	const passwordsList = [currPass, newPass, confirmPass]

	//* when cancel button is clicked
	if (intent === 'cancel') {
		return redirect('/account/settings')
	}

	//* validate passwords type
	const checkPasswordsType = validatePassType(passwordsList)
	if (!checkPasswordsType.isValid) {
		return data(
			{
				success: false,
				message: 'Password is required.',
			},
			{ status: 400 },
		)
	}

	//* validate passwords lenghts
	const validatePasswordsLength = validatePassLength(passwordsList)
	if (!validatePasswordsLength.isValid) {
		return data(
			{
				success: false,
				message: 'Password must be at least 8 characters long.',
			},
			{ status: 400 },
		)
	}

	//* get user email
	const userEmail = await getUserEmail(request)
	invariant(userEmail, `Email not found!`)

	//* validate password
	if (typeof currPass !== 'string' || currPass.length === 0) {
		return data(
			{
				success: false,
				message: 'Current password is required.',
			},
			{ status: 400 },
		)
	}

	//* check both new passwords match
	if (newPass !== confirmPass) {
		return data(
			{
				success: false,
				message: 'New passwords do not match.',
			},
			{ status: 400 },
		)
	}

	//* check user password is correct
	const user = await verifyLogin(userEmail, currPass)

	if (!user) {
		return data(
			{ success: false, message: 'Current password is incorrect.' },
			{ status: 400 },
		)
	}

	//* get user ID
	const userId = await getUserId(request)
	invariant(userId, `userId not found!`)

	if (typeof newPass !== 'string' || newPass.length === 0) {
		return data(
			{ success: false, message: 'Password is required.' },
			{ status: 400 },
		)
	}

	//* update user password
	await updateUserPassword(userId, newPass)

	return data({ success: true, message: 'Password updated successfully.' })
	//* logout
	// return logout({ request: request, redirectTo: "/explore" });
}

//**********************************
export default function ChangePaasswordPage() {
	const actionData = useActionData<typeof action>()

	let $form = useRef<HTMLFormElement>(null)
	const currPassRef = useRef<HTMLInputElement>(null)
	const newPassRef = useRef<HTMLInputElement>(null)
	const confirmPassRef = useRef<HTMLInputElement>(null)

	//* toast
	const { toast } = useToast()
	const { t } = useTranslation('settings')

	useEffect(() => {
		if (actionData) {
			$form.current?.reset()
			if (actionData.success) {
				toast({ title: actionData.message, variant: 'success' })
				currPassRef.current?.focus()
			} else {
				toast({
					title: actionData.message,
					variant: 'destructive',
					description: t('try_again'),
				})
			}
		}
	}, [actionData, toast])

	return (
		<Form method="post" className="space-y-6" noValidate ref={$form}>
			<Card className="w-full dark:border-white dark:bg-dark-boxes">
				<CardHeader>
					<CardTitle>{t('update_password')}</CardTitle>
					<CardDescription>{t('update_password_description')}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="currentPassword">{t('current_password')}</Label>
						<Input
							ref={currPassRef}
							id="currentPassword"
							name="currentPassword"
							placeholder={t('enter_current_password')}
							type="password"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="newPassword">{t('new_password')}</Label>
						<Input
							ref={newPassRef}
							id="newPassword"
							name="newPassword"
							placeholder={t('enter_new_password')}
							type="password"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="newPasswordConfirm">{t('confirm_password')}</Label>
						<Input
							ref={confirmPassRef}
							id="newPasswordConfirm"
							name="newPasswordConfirm"
							placeholder={t('confirm_new_password')}
							type="password"
						/>
					</div>
				</CardContent>
				<CardFooter>
					<Button type="submit" name="intent" value="update">
						{t('save_changes')}
					</Button>
				</CardFooter>
			</Card>
		</Form>
	)
}

export function ErrorBoundary() {
	return (
		<div className="flex h-full w-full items-center justify-center">
			<ErrorMessage />
		</div>
	)
}
