import {
	FlaskConical,
	GraduationCap,
	ThermometerSun,
	Waves,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLoaderData } from 'react-router'
import { type Route } from './+types/campaigns.templates._index'
import { NavBar } from '~/components/nav-bar'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { getUserCampaignTemplates } from '~/db/models/campaign-template.server'
import {
	campaignTemplates,
	type CampaignTemplate,
	type CampaignTemplateCategory,
} from '~/lib/campaign-templates'
import { getUserId } from '~/services/session-service.server'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await getUserId(request)
	const userTemplates = userId ? await getUserCampaignTemplates(userId) : []

	return {
		isLoggedIn: Boolean(userId),
		userTemplates,
	}
}

const categoryIcons = {
	climate: ThermometerSun,
	air_quality: FlaskConical,
	education: GraduationCap,
	water: Waves,
} satisfies Record<CampaignTemplateCategory, typeof ThermometerSun>

export default function CampaignTemplatesPage() {
	const { isLoggedIn, userTemplates } = useLoaderData<typeof loader>()
	const { t } = useTranslation('campaigns')

	return (
		<div className="min-h-screen bg-slate-50">
			<NavBar />
			<main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
				<section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<p className="text-sm font-medium text-green-700">
							{t('campaign_templates')}
						</p>
						<h1 className="text-3xl font-semibold tracking-tight text-slate-950">
							{t('campaign_templates_title')}
						</h1>
						<p className="mt-2 max-w-2xl text-slate-600">
							{t('campaign_templates_description')}
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						{isLoggedIn ? (
							<Button asChild>
								<Link to="/campaigns/templates/new">
									{t('create_template')}
								</Link>
							</Button>
						) : (
							<Button asChild>
								<Link to="/explore/login?redirectTo=/campaigns/templates/new">
									{t('login_to_create_template')}
								</Link>
							</Button>
						)}
						<Button asChild variant="outline">
							<Link to="/campaigns/new">{t('start_blank_campaign')}</Link>
						</Button>
					</div>
				</section>

				{userTemplates.length > 0 ? (
					<section className="space-y-4">
						<div>
							<h2 className="text-xl font-semibold text-slate-950">
								{t('your_templates')}
							</h2>
							<p className="mt-1 text-sm text-slate-600">
								{t('your_templates_description')}
							</p>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							{userTemplates.map((template) => (
								<UserTemplateCard key={template.id} template={template} />
							))}
						</div>
					</section>
				) : null}

				<section className="space-y-4">
					<div>
						<h2 className="text-xl font-semibold text-slate-950">
							{t('built_in_templates')}
						</h2>
						<p className="mt-1 text-sm text-slate-600">
							{t('built_in_templates_description')}
						</p>
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						{campaignTemplates.map((template) => (
							<BuiltInTemplateCard key={template.id} template={template} />
						))}
					</div>
				</section>
			</main>
		</div>
	)
}

function BuiltInTemplateCard({ template }: { template: CampaignTemplate }) {
	const { t } = useTranslation('campaigns')
	const Icon = categoryIcons[template.category]

	return (
		<TemplateCardShell
			icon={Icon}
			title={t(template.titleKey)}
			summary={t(template.summaryKey)}
			category={t(`template_category_${template.category}`)}
			phenomena={template.phenomena}
			gridSize={template.gridSize}
			duration={
				template.suggestedDurationDays
					? t('template_duration_days', {
							count: template.suggestedDurationDays,
						})
					: t('template_duration_flexible')
			}
			description={t(template.descriptionKey)}
			useHref={`/campaigns/new?template=${template.id}`}
		/>
	)
}

function UserTemplateCard({
	template,
}: {
	template: Awaited<ReturnType<typeof getUserCampaignTemplates>>[number]
}) {
	const { t } = useTranslation('campaigns')
	const category = template.category as CampaignTemplateCategory
	const Icon = categoryIcons[category] ?? ThermometerSun

	return (
		<TemplateCardShell
			icon={Icon}
			title={template.title}
			summary={template.summary}
			category={t(`template_category_${category}`)}
			phenomena={template.phenomena}
			gridSize={template.gridSize}
			duration={
				template.suggestedDurationDays
					? t('template_duration_days', {
							count: template.suggestedDurationDays,
						})
					: t('template_duration_flexible')
			}
			description={template.description}
			useHref={`/campaigns/new?template=user:${template.id}`}
		/>
	)
}

function TemplateCardShell({
	icon: Icon,
	title,
	summary,
	category,
	phenomena,
	gridSize,
	duration,
	description,
	useHref,
}: {
	icon: typeof ThermometerSun
	title: string
	summary: string
	category: string
	phenomena: string[]
	gridSize: number
	duration: string
	description: string
	useHref: string
}) {
	const { t } = useTranslation('campaigns')

	return (
		<article className="rounded-lg border border-slate-200 bg-white p-6">
			<div className="flex items-start gap-4">
				<div className="rounded-full bg-green-50 p-3 text-green-700">
					<Icon className="h-5 w-5" />
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<h2 className="text-xl font-semibold text-slate-950">{title}</h2>
						<Badge variant="secondary">{category}</Badge>
					</div>
					<p className="mt-2 text-sm text-slate-600">{summary}</p>
				</div>
			</div>

			<div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
				<TemplateMetric label={t('phenomena')} value={phenomena.join(', ')} />
				<TemplateMetric
					label={t('grid_size')}
					value={`${gridSize} x ${gridSize}`}
				/>
				<TemplateMetric label={t('template_duration')} value={duration} />
			</div>

			<p className="mt-5 line-clamp-4 text-sm text-slate-700">{description}</p>

			<Button asChild className="mt-5">
				<Link to={useHref}>{t('use_template')}</Link>
			</Button>
		</article>
	)
}

function TemplateMetric({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-md bg-slate-50 p-3">
			<div className="text-xs text-slate-500">{label}</div>
			<div className="mt-1 font-medium text-slate-950">{value}</div>
		</div>
	)
}
