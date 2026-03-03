import * as React from 'react'
import {
	Form,
	Link,
	data,
	redirect,
	useActionData,
	useLoaderData,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from 'react-router'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { drizzleClient } from '~/db.server'
import { getCurrentEffectiveTos, getTosRequirementForUser } from '~/models/tos.server'
import { tosAcceptance } from '~/schema/tos'
import { requireUser } from '~/utils/session.server'

function safeRedirectTo(value: string | null, fallback = '/') {
	if (!value) return fallback
	if (!value.startsWith('/')) return fallback
	if (value.startsWith('//')) return fallback
	return value
}

export async function loader({ request }: LoaderFunctionArgs) {
	const user = await requireUser(request)
	const url = new URL(request.url)
	const redirectTo = safeRedirectTo(url.searchParams.get('redirectTo'), '/')

	const req = await getTosRequirementForUser(user.id)
	if (!req.required) throw redirect(redirectTo)

	const tos = await getCurrentEffectiveTos()
	if (!tos) return data({ tos: null, redirectTo }, { status: 500 })

	return data({ tos, redirectTo })
}

export async function action({ request }: ActionFunctionArgs) {
	const user = await requireUser(request)
	const formData = await request.formData()

	const accepted = formData.get('accepted')
	const tosVersionId = formData.get('tosVersionId')
	const redirectTo = safeRedirectTo(formData.get('redirectTo') as string | null, '/')

	if (accepted !== 'on') {
		return data({ error: 'tos_must_accept' }, { status: 400 })
	}

	if (!tosVersionId || typeof tosVersionId !== 'string') {
		return data({ error: 'invalid_tos_version' }, { status: 400 })
	}

	const current = await getCurrentEffectiveTos()
	if (!current || current.id !== tosVersionId) {
		return data({ error: 'tos_not_current' }, { status: 400 })
	}

	await drizzleClient
		.insert(tosAcceptance)
		.values({ userId: user.id, tosVersionId: current.id })
		.onConflictDoNothing()

	throw redirect(redirectTo)
}

export default function TosRequiredModal() {
	const { tos, redirectTo } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const [checked, setChecked] = React.useState(false)

	return (
		<Dialog open onOpenChange={() => {}}>
			<DialogContent
				hideClose
				onEscapeKeyDown={(e) => e.preventDefault()}
				onPointerDownOutside={(e) => e.preventDefault()}
				onInteractOutside={(e) => e.preventDefault()}
				className="sm:max-w-lg"
			>
				<DialogHeader>
					<DialogTitle>Terms of Service update</DialogTitle>
					<DialogDescription>
						You need to accept the latest Terms of Service to continue using the app.
					</DialogDescription>
				</DialogHeader>

				{!tos ? (
					<div className="text-sm text-red-500">
						No effective Terms of Service are configured.
					</div>
				) : (
					<Form method="post" className="space-y-4">
						<input type="hidden" name="tosVersionId" value={tos.id} />
						<input type="hidden" name="redirectTo" value={redirectTo} />

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
								I agree to the{' '}
								<Link to="/terms" target="_blank" rel="noreferrer" className="underline">
									Terms of Service
								</Link>
								.
							</label>
						</div>

						{actionData?.error === 'tos_must_accept' && (
							<div className="text-sm text-red-500">
								You must accept the Terms to continue.
							</div>
						)}

						<DialogFooter className="sm:justify-between">
							<div className="text-sm text-muted-foreground">
								You can still{' '}
								<Link to="/settings/delete" className="underline">
									delete your account
								</Link>
								.
							</div>

							<Button type="submit" disabled={!checked}>
								Continue
							</Button>
						</DialogFooter>
					</Form>
				)}
			</DialogContent>
		</Dialog>
	)
}