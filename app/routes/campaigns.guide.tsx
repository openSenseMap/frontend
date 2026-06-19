import {
	Bookmark,
	ClipboardCheck,
	Map,
	MessageSquare,
	Radio,
	SquareActivity,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { type Route } from './+types/campaigns.guide'
import { NavBar } from '~/components/nav-bar'
import { Button } from '~/components/ui/button'

export function loader(_: Route.LoaderArgs) {
	return null
}

export default function CampaignGuidePage() {
	const { t } = useTranslation('campaigns')

	return (
		<div className="min-h-screen bg-slate-50">
			<NavBar />
			<main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
				<section className="rounded-lg border border-slate-200 bg-white p-6">
					<p className="text-sm font-medium text-green-700">
						{t('campaign_guide')}
					</p>
					<div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
						<div>
							<h1 className="text-3xl font-semibold tracking-tight text-slate-950">
								{t('campaign_guide_title')}
							</h1>
							<p className="mt-3 max-w-3xl text-slate-600">
								{t('campaign_guide_intro')}
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<Button asChild>
								<Link to="/campaigns/new">{t('create_campaign')}</Link>
							</Button>
							<Button asChild variant="outline">
								<Link to="/campaigns">{t('browse_campaigns')}</Link>
							</Button>
						</div>
					</div>
				</section>

				<section className="grid gap-4 md:grid-cols-3">
					<GuideSummaryCard
						icon={Map}
						title={t('guide_summary_area_title')}
						text={t('guide_summary_area_text')}
					/>
					<GuideSummaryCard
						icon={SquareActivity}
						title={t('guide_summary_measurements_title')}
						text={t('guide_summary_measurements_text')}
					/>
					<GuideSummaryCard
						icon={MessageSquare}
						title={t('guide_summary_coordination_title')}
						text={t('guide_summary_coordination_text')}
					/>
				</section>

				<section className="grid gap-6 lg:grid-cols-2">
					<GuideChecklist
						icon={ClipboardCheck}
						title={t('guide_create_title')}
						description={t('guide_create_description')}
						items={[
							t('guide_create_step_goal'),
							t('guide_create_step_phenomena'),
							t('guide_create_step_area'),
							t('guide_create_step_grid'),
							t('guide_create_step_discussion'),
							t('guide_create_step_updates'),
						]}
					/>
					<GuideChecklist
						icon={Radio}
						title={t('guide_contribute_title')}
						description={t('guide_contribute_description')}
						items={[
							t('guide_contribute_step_browse'),
							t('guide_contribute_step_device'),
							t('guide_contribute_step_measure'),
							t('guide_contribute_step_coverage'),
							t('guide_contribute_step_discussion'),
							t('guide_contribute_step_bookmark'),
						]}
					/>
				</section>

				<section className="grid gap-6 lg:grid-cols-[1fr_360px]">
					<div className="space-y-6">
						<GuideSection
							title={t('guide_coverage_title')}
							text={t('guide_coverage_text')}
							items={[
								t('guide_coverage_point_cells'),
								t('guide_coverage_point_requirements'),
								t('guide_coverage_point_gaps'),
							]}
						/>
						<GuideSection
							title={t('guide_organize_title')}
							text={t('guide_organize_text')}
							items={[
								t('guide_organize_point_updates'),
								t('guide_organize_point_discussion'),
								t('guide_organize_point_results'),
							]}
						/>
					</div>
					<aside className="rounded-lg border border-green-200 bg-green-50 p-6">
						<div className="w-fit rounded-full bg-white p-3 text-green-700">
							<Bookmark className="h-5 w-5" />
						</div>
						<h2 className="mt-4 text-xl font-semibold text-slate-950">
							{t('guide_bookmarks_title')}
						</h2>
						<p className="mt-3 text-slate-700">{t('guide_bookmarks_text')}</p>
						<Button asChild variant="outline" className="mt-5 bg-white">
							<Link to="/campaigns?bookmarks=bookmarked">
								{t('view_bookmarked_campaigns')}
							</Link>
						</Button>
					</aside>
				</section>
			</main>
		</div>
	)
}

function GuideSummaryCard({
	icon: Icon,
	title,
	text,
}: {
	icon: typeof Map
	title: string
	text: string
}) {
	return (
		<div className="rounded-lg border border-slate-200 bg-white p-5">
			<div className="w-fit rounded-full bg-green-50 p-3 text-green-700">
				<Icon className="h-5 w-5" />
			</div>
			<h2 className="mt-4 font-semibold text-slate-950">{title}</h2>
			<p className="mt-2 text-sm text-slate-600">{text}</p>
		</div>
	)
}

function GuideChecklist({
	icon: Icon,
	title,
	description,
	items,
}: {
	icon: typeof ClipboardCheck
	title: string
	description: string
	items: string[]
}) {
	return (
		<section className="rounded-lg border border-slate-200 bg-white p-6">
			<div className="flex items-start gap-3">
				<div className="rounded-full bg-green-50 p-3 text-green-700">
					<Icon className="h-5 w-5" />
				</div>
				<div>
					<h2 className="text-xl font-semibold text-slate-950">{title}</h2>
					<p className="mt-1 text-sm text-slate-600">{description}</p>
				</div>
			</div>
			<ol className="mt-5 space-y-3">
				{items.map((item, index) => (
					<li key={item} className="flex gap-3 text-sm text-slate-700">
						<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
							{index + 1}
						</span>
						<span>{item}</span>
					</li>
				))}
			</ol>
		</section>
	)
}

function GuideSection({
	title,
	text,
	items,
}: {
	title: string
	text: string
	items: string[]
}) {
	return (
		<section className="rounded-lg border border-slate-200 bg-white p-6">
			<h2 className="text-xl font-semibold text-slate-950">{title}</h2>
			<p className="mt-2 text-slate-600">{text}</p>
			<ul className="mt-5 space-y-2">
				{items.map((item) => (
					<li key={item} className="flex gap-3 text-sm text-slate-700">
						<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green-700" />
						<span>{item}</span>
					</li>
				))}
			</ul>
		</section>
	)
}
