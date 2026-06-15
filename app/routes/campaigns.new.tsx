import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import {
	Form,
	redirect,
	useActionData,
	useLoaderData,
	useNavigation,
} from 'react-router'
import { type Route } from './+types/campaigns.new'
import { CampaignAreaEditor } from '~/components/campaigns/campaign-area-editor'
import { ClientOnly } from '~/components/client-only'
import { NavBar } from '~/components/nav-bar'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { createCampaign } from '~/db/models/campaign.server'
import { getPhenomena } from '~/db/models/phenomena.server'
import { getCampaignCenterpoint, parseCampaignArea } from '~/lib/campaign'
import { campaignFormSchema } from '~/lib/validations/campaign'
import { requireUserId } from '~/services/session-service.server'

type ActionData = {
	errors?: Record<string, string>
	values?: Record<string, string>
}

export async function loader({ request }: Route.LoaderArgs) {
	await requireUserId(request)
	const phenomena = await getPhenomena()

	return { phenomena }
}

export async function action({
	request,
}: Route.ActionArgs): Promise<Response | ActionData> {
	const ownerId = await requireUserId(request)
	const formData = await request.formData()

	const values = {
		title: String(formData.get('title') ?? ''),
		description: String(formData.get('description') ?? ''),
		requirements: String(formData.get('requirements') ?? ''),
		phenomena: parsePhenomena(String(formData.get('phenomena') ?? '')),
		gridSize: parseNumber(formData.get('gridSize'), 6),
		minDevicesPerCell: parseNumber(formData.get('minDevicesPerCell'), 1),
		minMeasurementsPerCell: parseNumber(
			formData.get('minMeasurementsPerCell'),
			1,
		),
		areaGeojson: String(formData.get('areaGeojson') ?? ''),
		startDate: parseOptionalDate(formData.get('startDate')),
		endDate: parseOptionalDate(formData.get('endDate')),
	}

	try {
		const parsed = campaignFormSchema.parse(values)
		const area = parseCampaignArea(parsed.areaGeojson)
		const centerpoint = getCampaignCenterpoint(area)

		const createdCampaign = await createCampaign({
			title: parsed.title,
			description: parsed.description,
			requirements: parsed.requirements,
			phenomena: parsed.phenomena,
			gridSize: parsed.gridSize,
			minDevicesPerCell: parsed.minDevicesPerCell,
			minMeasurementsPerCell: parsed.minMeasurementsPerCell,
			area,
			centerpoint,
			public: true,
			startDate: parsed.startDate,
			endDate: parsed.endDate,
			ownerId,
		})

		return redirect(`/campaigns/${createdCampaign.slug}`)
	} catch (error) {
		return {
			errors: getActionErrors(error),
			values: {
				title: values.title,
				description: values.description,
				requirements: values.requirements,
				phenomena: values.phenomena.join(', '),
				gridSize: String(values.gridSize),
				minDevicesPerCell: String(values.minDevicesPerCell),
				minMeasurementsPerCell: String(values.minMeasurementsPerCell),
				areaGeojson: values.areaGeojson,
				startDate: String(formData.get('startDate') ?? ''),
				endDate: String(formData.get('endDate') ?? ''),
			},
		}
	}
}

export default function NewCampaignPage() {
	const { phenomena } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()
	const { t } = useTranslation('campaigns')
	const isSubmitting = navigation.state !== 'idle'

	return (
		<div className="min-h-screen bg-slate-50">
			<NavBar />
			<main className="mx-auto w-full max-w-5xl px-4 py-8">
				<div className="mb-8">
					<p className="text-sm font-medium text-green-700">{t('campaigns')}</p>
					<h1 className="text-3xl font-semibold tracking-tight text-slate-950">
						{t('create_campaign')}
					</h1>
					<p className="mt-2 max-w-2xl text-slate-600">
						{t('create_campaign_description')}
					</p>
				</div>

				<Form method="post" className="space-y-8">
					<section className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
						<div className="grid gap-5 md:grid-cols-2">
							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="title">{t('title')}</Label>
								<Input
									id="title"
									name="title"
									defaultValue={actionData?.values?.title}
									required
								/>
								<FieldError message={actionData?.errors?.title} />
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="description">{t('description')}</Label>
								<Textarea
									id="description"
									name="description"
									defaultValue={actionData?.values?.description}
									required
									className="min-h-32"
								/>
								<FieldError message={actionData?.errors?.description} />
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="requirements">{t('requirements')}</Label>
								<Textarea
									id="requirements"
									name="requirements"
									defaultValue={actionData?.values?.requirements}
									required
									className="min-h-40"
								/>
								<FieldError message={actionData?.errors?.requirements} />
							</div>
							<div className="space-y-2 md:col-span-2">
								<h2 className="text-lg font-semibold text-slate-950">
									{t('measurement_requirements')}
								</h2>
								<p className="text-sm text-slate-600">
									{t('measurement_requirements_description')}
								</p>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="phenomena">{t('phenomena')}</Label>
								<Input
									id="phenomena"
									name="phenomena"
									defaultValue={actionData?.values?.phenomena}
									list="known-phenomena"
									placeholder={t('phenomena_placeholder')}
									required
								/>
								<datalist id="known-phenomena">
									{phenomena.map((phenomenon) => (
										<option key={phenomenon} value={phenomenon} />
									))}
								</datalist>
								<p className="text-xs text-slate-500">{t('phenomena_help')}</p>
								<FieldError message={actionData?.errors?.phenomena} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="gridSize">{t('grid_size')}</Label>
								<Input
									id="gridSize"
									name="gridSize"
									type="number"
									min={2}
									max={20}
									defaultValue={actionData?.values?.gridSize ?? 6}
									required
								/>
								<p className="text-xs text-slate-500">{t('grid_size_help')}</p>
								<FieldError message={actionData?.errors?.gridSize} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="minDevicesPerCell">
									{t('min_devices_per_cell')}
								</Label>
								<Input
									id="minDevicesPerCell"
									name="minDevicesPerCell"
									type="number"
									min={0}
									max={100}
									defaultValue={actionData?.values?.minDevicesPerCell ?? 1}
									required
								/>
								<FieldError message={actionData?.errors?.minDevicesPerCell} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="minMeasurementsPerCell">
									{t('min_measurements_per_cell')}
								</Label>
								<Input
									id="minMeasurementsPerCell"
									name="minMeasurementsPerCell"
									type="number"
									min={1}
									defaultValue={actionData?.values?.minMeasurementsPerCell ?? 1}
									required
								/>
								<FieldError
									message={actionData?.errors?.minMeasurementsPerCell}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="startDate">{t('start_date')}</Label>
								<Input
									id="startDate"
									name="startDate"
									type="date"
									defaultValue={actionData?.values?.startDate}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="endDate">{t('end_date')}</Label>
								<Input
									id="endDate"
									name="endDate"
									type="date"
									defaultValue={actionData?.values?.endDate}
								/>
								<FieldError message={actionData?.errors?.endDate} />
							</div>
						</div>
					</section>

					<section className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
						<div>
							<h2 className="text-xl font-semibold text-slate-950">
								{t('campaign_area')}
							</h2>
							<p className="mt-1 text-sm text-slate-600">
								{t('campaign_area_description')}
							</p>
						</div>
						<ClientOnly
							fallback={
								<div className="h-[420px] rounded-lg border border-slate-200 bg-slate-100" />
							}
						>
							{() => (
								<CampaignAreaEditor
									defaultValue={actionData?.values?.areaGeojson}
									error={actionData?.errors?.areaGeojson}
								/>
							)}
						</ClientOnly>
					</section>

					<div className="flex justify-end">
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? t('creating_campaign') : t('create_campaign')}
						</Button>
					</div>
				</Form>
			</main>
		</div>
	)
}

function FieldError({ message }: { message?: string }) {
	if (!message) return null
	return <p className="text-sm text-red-600">{message}</p>
}

function parsePhenomena(value: string) {
	return Array.from(
		new Set(
			value
				.split(',')
				.map((item) => item.trim())
				.filter(Boolean),
		),
	)
}

function parseOptionalDate(value: FormDataEntryValue | null) {
	if (typeof value !== 'string' || value.length === 0) return undefined
	return new Date(`${value}T00:00:00.000Z`)
}

function parseNumber(value: FormDataEntryValue | null, fallback: number) {
	if (typeof value !== 'string' || value.length === 0) return fallback
	return Number(value)
}

function getActionErrors(error: unknown) {
	if (error instanceof z.ZodError) {
		return Object.fromEntries(
			error.issues.map((issue) => [
				String(issue.path[0] ?? 'form'),
				issue.message,
			]),
		)
	}

	if (error instanceof SyntaxError) {
		return { areaGeojson: 'Area GeoJSON is not valid JSON.' }
	}

	return { form: 'Campaign could not be created.' }
}
