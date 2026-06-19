import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import {
	data,
	Form,
	Link,
	redirect,
	useActionData,
	useNavigation,
} from 'react-router'
import { type Route } from './+types/campaigns.templates.new'
import { NavBar } from '~/components/nav-bar'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { createUserCampaignTemplate } from '~/db/models/campaign-template.server'
import { requireCampaignsEnabled } from '~/lib/feature-flags.server'
import { campaignTemplateFormSchema } from '~/lib/validations/campaign'
import { requireUserId } from '~/services/session-service.server'

type ActionData = {
	errors?: Record<string, string>
	values?: Record<string, string>
}

export async function loader({ request }: Route.LoaderArgs) {
	requireCampaignsEnabled()
	await requireUserId(request)

	return null
}

export async function action({ request }: Route.ActionArgs) {
	requireCampaignsEnabled()

	const ownerId = await requireUserId(request)
	const formData = await request.formData()
	const values = {
		title: String(formData.get('title') ?? ''),
		summary: String(formData.get('summary') ?? ''),
		description: String(formData.get('description') ?? ''),
		requirements: String(formData.get('requirements') ?? ''),
		category: String(formData.get('category') ?? ''),
		phenomena: parsePhenomena(String(formData.get('phenomena') ?? '')),
		gridSize: parseNumber(formData.get('gridSize'), 6),
		minDevicesPerCell: parseNumber(formData.get('minDevicesPerCell'), 1),
		minMeasurementsPerCell: parseNumber(
			formData.get('minMeasurementsPerCell'),
			1,
		),
		suggestedDurationDays: parseOptionalNumber(
			formData.get('suggestedDurationDays'),
		),
	}

	const parsed = campaignTemplateFormSchema.safeParse(values)

	if (!parsed.success) {
		return templateFormError(getActionErrors(parsed.error), values)
	}

	await createUserCampaignTemplate({
		...parsed.data,
		ownerId,
	})

	return redirect('/campaigns/templates')
}

export default function NewCampaignTemplatePage() {
	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()
	const { t } = useTranslation('campaigns')
	const isSubmitting = navigation.state !== 'idle'

	return (
		<div className="min-h-screen bg-slate-50">
			<NavBar />
			<main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8">
				<section>
					<p className="text-sm font-medium text-green-700">
						{t('campaign_templates')}
					</p>
					<h1 className="text-3xl font-semibold tracking-tight text-slate-950">
						{t('create_template')}
					</h1>
					<p className="mt-2 max-w-2xl text-slate-600">
						{t('create_template_description')}
					</p>
				</section>

				<Form method="post" className="space-y-8">
					{actionData?.errors ? (
						<Alert variant="destructive">
							<AlertTitle>{t('template_not_created')}</AlertTitle>
							<AlertDescription>
								<ul className="list-disc space-y-1 pl-4">
									{Object.values(actionData.errors).map((message) => (
										<li key={message}>{message}</li>
									))}
								</ul>
							</AlertDescription>
						</Alert>
					) : null}

					<section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6 md:grid-cols-2">
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
							<Label htmlFor="summary">{t('template_summary')}</Label>
							<Input
								id="summary"
								name="summary"
								defaultValue={actionData?.values?.summary}
								required
							/>
							<FieldError message={actionData?.errors?.summary} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="category">{t('template_category')}</Label>
							<Select
								name="category"
								defaultValue={actionData?.values?.category ?? 'climate'}
							>
								<SelectTrigger id="category">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="climate">
										{t('template_category_climate')}
									</SelectItem>
									<SelectItem value="air_quality">
										{t('template_category_air_quality')}
									</SelectItem>
									<SelectItem value="education">
										{t('template_category_education')}
									</SelectItem>
									<SelectItem value="water">
										{t('template_category_water')}
									</SelectItem>
								</SelectContent>
							</Select>
							<FieldError message={actionData?.errors?.category} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="suggestedDurationDays">
								{t('template_duration')}
							</Label>
							<Input
								id="suggestedDurationDays"
								name="suggestedDurationDays"
								type="number"
								min={1}
								max={365}
								defaultValue={actionData?.values?.suggestedDurationDays}
							/>
							<FieldError message={actionData?.errors?.suggestedDurationDays} />
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
							<Label htmlFor="phenomena">{t('phenomena')}</Label>
							<Input
								id="phenomena"
								name="phenomena"
								defaultValue={actionData?.values?.phenomena}
								placeholder={t('phenomena_placeholder')}
								required
							/>
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
					</section>

					<div className="flex justify-end gap-2">
						<Button asChild variant="outline">
							<Link to="/campaigns/templates">{t('cancel')}</Link>
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? t('creating_template') : t('create_template')}
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

function parseNumber(value: FormDataEntryValue | null, fallback: number) {
	if (typeof value !== 'string' || value.length === 0) return fallback
	return Number(value)
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
	if (typeof value !== 'string' || value.length === 0) return undefined
	return Number(value)
}

function templateFormError(
	errors: Record<string, string>,
	values: {
		title: string
		summary: string
		description: string
		requirements: string
		category: string
		phenomena: string[]
		gridSize: number
		minDevicesPerCell: number
		minMeasurementsPerCell: number
		suggestedDurationDays?: number
	},
) {
	return data(
		{
			errors,
			values: {
				title: values.title,
				summary: values.summary,
				description: values.description,
				requirements: values.requirements,
				category: values.category,
				phenomena: values.phenomena.join(', '),
				gridSize: String(values.gridSize),
				minDevicesPerCell: String(values.minDevicesPerCell),
				minMeasurementsPerCell: String(values.minMeasurementsPerCell),
				suggestedDurationDays: values.suggestedDurationDays
					? String(values.suggestedDurationDays)
					: '',
			},
		},
		{ status: 400 },
	)
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

	return { form: 'Template could not be created.' }
}
