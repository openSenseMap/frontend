import { Form, Link, redirect, useActionData } from 'react-router'
import { type Route } from './+types/admin.rate-limits'
import {
	createRateLimitGrant,
	getRateLimitGrants,
	updateRateLimitGrant,
} from '~/db/models/rate-limit-grant.server'
import {
	type RateLimitGrantKind,
	type RateLimitTier,
} from '~/db/schema/rate-limit-grant'

const GRANT_KINDS = ['user_email', 'email_domain', 'credential_hash'] as const
const RATE_LIMIT_TIERS = ['standard_plus', 'trusted', 'high_volume'] as const

type ActionData = {
	error?: boolean
	message?: string
	fieldErrors?: {
		kind?: string
		value?: string
		tier?: string
		expiresAt?: string
	}
}

export async function loader() {
	const grants = await getRateLimitGrants()
	return { grants }
}

export async function action({
	request,
}: Route.ActionArgs): Promise<Response | ActionData> {
	const formData = await request.formData()
	const intent = getString(formData, '_action')

	const parsed = parseGrantForm(formData)
	if (!parsed.ok) {
		return {
			error: true,
			message: 'Please fix the highlighted fields.',
			fieldErrors: parsed.fieldErrors,
		}
	}

	try {
		switch (intent) {
			case 'create':
				await createRateLimitGrant(parsed.value)
				return redirect('/admin/rate-limits')

			case 'update': {
				const id = getString(formData, 'id')
				if (!id) {
					return {
						error: true,
						message: 'Missing grant id.',
					}
				}

				await updateRateLimitGrant(id, parsed.value)
				return redirect('/admin/rate-limits')
			}

			default:
				return {
					error: true,
					message: 'Unknown action.',
				}
		}
	} catch (error) {
		return {
			error: true,
			message:
				error instanceof Error
					? error.message
					: 'Failed to save rate limit grant.',
		}
	}
}

export default function AdminRateLimitsRoute({
	loaderData,
}: Route.ComponentProps) {
	const { grants } = loaderData
	const actionData = useActionData<typeof action>()

	return (
		<div className="flex w-full flex-col gap-8">
			<div>
				<Link to="/admin" className="text-sm underline underline-offset-2">
					← Back to admin
				</Link>
			</div>

			<div>
				<h2 className="text-xl font-semibold">Rate limit grants</h2>
				<p className="mt-1 text-sm text-gray-600">
					Grant finite higher rate-limit tiers to users, domains, or credential
					hashes.
				</p>
			</div>

			{actionData?.message ? (
				<p className={actionData.error ? 'text-red-600' : 'text-green-700'}>
					{actionData.message}
				</p>
			) : null}

			<section className="rounded border p-4">
				<h3 className="text-lg font-medium">Create grant</h3>
				<Form method="post" className="mt-4 grid gap-4 md:grid-cols-6">
					<input type="hidden" name="_action" value="create" />
					<GrantFields actionData={actionData} />
					<div className="md:col-span-6">
						<button
							type="submit"
							className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
						>
							Create grant
						</button>
					</div>
				</Form>
			</section>

			<section>
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-lg font-medium">Existing grants</h3>
					<span className="text-sm text-gray-600">Total: {grants.length}</span>
				</div>

				<div className="overflow-x-auto">
					<table className="min-w-full border-2 border-black text-sm">
						<thead>
							<tr className="border-2 border-black">
								<th className="border-r-2 border-black p-2 text-left">Kind</th>
								<th className="border-r-2 border-black p-2 text-left">Value</th>
								<th className="border-r-2 border-black p-2 text-left">Tier</th>
								<th className="border-r-2 border-black p-2 text-left">
									Expires
								</th>
								<th className="border-r-2 border-black p-2 text-left">
									Enabled
								</th>
								<th className="border-r-2 border-black p-2 text-left">Note</th>
								<th className="p-2 text-left">Actions</th>
							</tr>
						</thead>
						<tbody>
							{grants.map((grant) => (
								<tr key={grant.id} className="border-2 border-black align-top">
									<td className="border-r-2 border-black p-2">
										<Form method="post" id={`grant-${grant.id}`} />
										<input
											form={`grant-${grant.id}`}
											type="hidden"
											name="id"
											value={grant.id}
										/>
										<input
											form={`grant-${grant.id}`}
											type="hidden"
											name="_action"
											value="update"
										/>
										<select
											form={`grant-${grant.id}`}
											name="kind"
											defaultValue={grant.kind}
											className="rounded border border-gray-300 px-2 py-1"
										>
											{GRANT_KINDS.map((kind) => (
												<option key={kind} value={kind}>
													{kind}
												</option>
											))}
										</select>
									</td>
									<td className="border-r-2 border-black p-2">
										<input
											form={`grant-${grant.id}`}
											name="value"
											defaultValue={grant.value}
											className="w-64 rounded border border-gray-300 px-2 py-1"
										/>
									</td>
									<td className="border-r-2 border-black p-2">
										<select
											form={`grant-${grant.id}`}
											name="tier"
											defaultValue={grant.tier}
											className="rounded border border-gray-300 px-2 py-1"
										>
											{RATE_LIMIT_TIERS.map((tier) => (
												<option key={tier} value={tier}>
													{tier}
												</option>
											))}
										</select>
									</td>
									<td className="border-r-2 border-black p-2">
										<input
											form={`grant-${grant.id}`}
											type="datetime-local"
											name="expiresAt"
											defaultValue={toDateTimeLocalValue(grant.expiresAt)}
											className="rounded border border-gray-300 px-2 py-1"
										/>
									</td>
									<td className="border-r-2 border-black p-2">
										<input
											form={`grant-${grant.id}`}
											type="checkbox"
											name="enabled"
											defaultChecked={grant.enabled}
											className="h-4 w-4"
										/>
									</td>
									<td className="border-r-2 border-black p-2">
										<textarea
											form={`grant-${grant.id}`}
											name="note"
											defaultValue={grant.note ?? ''}
											rows={2}
											className="w-64 rounded border border-gray-300 px-2 py-1"
										/>
									</td>
									<td className="p-2">
										<button
											form={`grant-${grant.id}`}
											type="submit"
											className="rounded bg-black px-3 py-1 text-sm font-medium text-white"
										>
											Save
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	)
}

function GrantFields({ actionData }: { actionData?: ActionData }) {
	return (
		<>
			<div className="md:col-span-2">
				<label htmlFor="kind" className="block text-sm font-medium">
					Kind
				</label>
				<select
					id="kind"
					name="kind"
					className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
				>
					{GRANT_KINDS.map((kind) => (
						<option key={kind} value={kind}>
							{kind}
						</option>
					))}
				</select>
				<FieldError>{actionData?.fieldErrors?.kind}</FieldError>
			</div>

			<div className="md:col-span-4">
				<label htmlFor="value" className="block text-sm font-medium">
					Value
				</label>
				<input
					id="value"
					name="value"
					className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
				/>
				<FieldError>{actionData?.fieldErrors?.value}</FieldError>
			</div>

			<div className="md:col-span-2">
				<label htmlFor="tier" className="block text-sm font-medium">
					Tier
				</label>
				<select
					id="tier"
					name="tier"
					className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
				>
					{RATE_LIMIT_TIERS.map((tier) => (
						<option key={tier} value={tier}>
							{tier}
						</option>
					))}
				</select>
				<FieldError>{actionData?.fieldErrors?.tier}</FieldError>
			</div>

			<div className="md:col-span-2">
				<label htmlFor="expiresAt" className="block text-sm font-medium">
					Expires at
				</label>
				<input
					id="expiresAt"
					type="datetime-local"
					name="expiresAt"
					className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
				/>
				<FieldError>{actionData?.fieldErrors?.expiresAt}</FieldError>
			</div>

			<div className="md:col-span-2">
				<label htmlFor="note" className="block text-sm font-medium">
					Note
				</label>
				<input
					id="note"
					name="note"
					className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
				/>
			</div>
		</>
	)
}

function FieldError({ children }: { children?: string }) {
	return children ? (
		<p className="mt-1 text-sm text-red-600">{children}</p>
	) : null
}

function parseGrantForm(formData: FormData):
	| {
			ok: true
			value: {
				kind: RateLimitGrantKind
				value: string
				tier: RateLimitTier
				enabled: boolean
				note: string | null
				expiresAt: Date | null
			}
	  }
	| { ok: false; fieldErrors: ActionData['fieldErrors'] } {
	const kind = parseKind(formData.get('kind'))
	const tier = parseTier(formData.get('tier'))
	const rawValue = getString(formData, 'value')
	const note = getString(formData, 'note').trim() || null
	const expiresAtResult = parseExpiresAt(getString(formData, 'expiresAt'))
	const fieldErrors: ActionData['fieldErrors'] = {}

	if (!kind) fieldErrors.kind = 'Choose a valid grant kind.'
	if (!tier) fieldErrors.tier = 'Choose a valid tier.'
	if (!rawValue.trim()) fieldErrors.value = 'Value is required.'
	else if (kind) {
		const valueError = validateValue(kind, rawValue)
		if (valueError) fieldErrors.value = valueError
	}
	if (!expiresAtResult.ok) fieldErrors.expiresAt = expiresAtResult.error

	if (
		fieldErrors.kind ||
		fieldErrors.value ||
		fieldErrors.tier ||
		fieldErrors.expiresAt ||
		!expiresAtResult.ok
	) {
		return { ok: false, fieldErrors }
	}

	const expiresAt = expiresAtResult.value

	return {
		ok: true,
		value: {
			kind: kind!,
			value: rawValue,
			tier: tier!,
			enabled: formData.get('enabled') === 'on' || !formData.has('id'),
			note,
			expiresAt,
		},
	}
}

function parseKind(
	value: FormDataEntryValue | null,
): RateLimitGrantKind | null {
	return GRANT_KINDS.includes(value as RateLimitGrantKind)
		? (value as RateLimitGrantKind)
		: null
}

function parseTier(value: FormDataEntryValue | null): RateLimitTier | null {
	return RATE_LIMIT_TIERS.includes(value as RateLimitTier)
		? (value as RateLimitTier)
		: null
}

function validateValue(kind: RateLimitGrantKind, value: string) {
	const trimmed = value.trim()
	if (kind === 'user_email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
		return 'Enter a valid email address.'
	}

	if (kind === 'email_domain') {
		const domain = trimmed.replace(/^@/, '')
		if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
			return 'Enter a valid domain, for example school.example.'
		}
	}

	if (kind === 'credential_hash' && !/^[a-f0-9]{64}$/.test(trimmed)) {
		return 'Enter a lowercase SHA-256 hash.'
	}

	return null
}

function parseExpiresAt(
	value: string,
): { ok: true; value: Date | null } | { ok: false; error: string } {
	if (!value.trim()) return { ok: true, value: null }

	const date = new Date(value)
	if (Number.isNaN(date.getTime())) {
		return { ok: false, error: 'Enter a valid expiry date.' }
	}

	return { ok: true, value: date }
}

function toDateTimeLocalValue(value: Date | string | null) {
	if (!value) return ''
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return ''
	const offsetMs = date.getTimezoneOffset() * 60_000
	return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function getString(formData: FormData, key: string) {
	const value = formData.get(key)
	return typeof value === 'string' ? value : ''
}
