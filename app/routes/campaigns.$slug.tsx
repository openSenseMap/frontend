import { Bookmark, CalendarDays, User } from 'lucide-react'
import { type TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import {
	Form,
	Link,
	redirect,
	useLoaderData,
	useNavigation,
} from 'react-router'
import { type Route } from './+types/campaigns.$slug'
import { CampaignMapPreview } from '~/components/campaigns/campaign-map-preview'
import { ClientOnly } from '~/components/client-only'
import { NavBar } from '~/components/nav-bar'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	bookmarkCampaign,
	getCampaignBookmarkCount,
	isCampaignBookmarked,
	removeCampaignBookmark,
} from '~/db/models/campaign-bookmark.server'
import { getCampaignBySlug } from '~/db/models/campaign.server'
import { formatPhenomenonLabel } from '~/lib/campaign'
import { requireCampaignsEnabled } from '~/lib/feature-flags.server'
import { getCampaignCoverage } from '~/services/campaign-coverage.server'
import { getUserId, requireUserId } from '~/services/session-service.server'

export async function loader({ params, request }: Route.LoaderArgs) {
	requireCampaignsEnabled()

	const campaign = await getCampaignBySlug(params.slug)
	const userId = await getUserId(request)

	if (!campaign) {
		throw new Response('Campaign not found', { status: 404 })
	}

	const [coverage, isBookmarked, bookmarkCount] = await Promise.all([
		getCampaignCoverage(campaign),
		userId
			? isCampaignBookmarked({ campaignId: campaign.id, userId })
			: Promise.resolve(false),
		getCampaignBookmarkCount(campaign.id),
	])

	return {
		campaign,
		coverage,
		canEdit: userId === campaign.ownerId,
		isLoggedIn: Boolean(userId),
		isBookmarked,
		bookmarkCount,
	}
}

export async function action({ params, request }: Route.ActionArgs) {
	requireCampaignsEnabled()

	const userId = await requireUserId(request)
	const campaign = await getCampaignBySlug(params.slug)

	if (!campaign) {
		throw new Response('Campaign not found', { status: 404 })
	}

	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === 'bookmark') {
		await bookmarkCampaign({ campaignId: campaign.id, userId })
	}

	if (intent === 'remove-bookmark') {
		await removeCampaignBookmark({ campaignId: campaign.id, userId })
	}

	return redirect(`/campaigns/${campaign.slug}`)
}

export default function CampaignDetailPage() {
	const { campaign, coverage, isLoggedIn, isBookmarked, bookmarkCount } =
		useLoaderData<typeof loader>()
	const navigation = useNavigation()
	const { t } = useTranslation('campaigns')
	const isBookmarkSubmitting =
		navigation.state !== 'idle' &&
		(navigation.formData?.get('intent') === 'bookmark' ||
			navigation.formData?.get('intent') === 'remove-bookmark')

	return (
		<div className="min-h-screen bg-slate-50">
			<NavBar />
			<main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_420px]">
				<section className="space-y-8">
					<div className="space-y-4">
						<div className="flex flex-wrap gap-2">
							{campaign.phenomena.map((phenomenon) => (
								<Badge key={phenomenon} variant="secondary">
									{formatPhenomenonLabel(phenomenon)}
								</Badge>
							))}
						</div>
						<h1 className="text-4xl font-semibold tracking-tight text-slate-950">
							{campaign.title}
						</h1>
						<div className="flex flex-wrap gap-4 text-sm text-slate-600">
							<span className="inline-flex items-center gap-2">
								<User className="h-4 w-4" />
								{campaign.owner?.name ?? t('unknown_organizer')}
							</span>
							<span className="inline-flex items-center gap-2">
								<CalendarDays className="h-4 w-4" />
								{formatDateRange(campaign.startDate, campaign.endDate)}
							</span>
						</div>
					</div>

					<article className="rounded-lg border border-slate-200 bg-white p-6">
						<h2 className="text-xl font-semibold text-slate-950">
							{t('goal')}
						</h2>
						<p className="mt-3 whitespace-pre-wrap text-slate-700">
							{campaign.description}
						</p>
					</article>

					<article className="rounded-lg border border-slate-200 bg-white p-6">
						<h2 className="text-xl font-semibold text-slate-950">
							{t('requirements')}
						</h2>
						<p className="mt-3 whitespace-pre-wrap text-slate-700">
							{campaign.requirements}
						</p>
					</article>

					<article className="rounded-lg border border-slate-200 bg-white p-6">
						<h2 className="text-xl font-semibold text-slate-950">
							{t('measurement_requirements')}
						</h2>
						<dl className="mt-4 grid gap-4 sm:grid-cols-3">
							<RequirementValue
								label={t('grid_size')}
								value={`${campaign.gridSize} x ${campaign.gridSize}`}
							/>
							<RequirementValue
								label={t('min_devices_per_cell')}
								value={campaign.minDevicesPerCell}
							/>
							<RequirementValue
								label={t('min_measurements_per_cell')}
								value={campaign.minMeasurementsPerCell}
							/>
						</dl>
					</article>
				</section>

				<aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
					<ClientOnly
						fallback={
							<div className="h-[420px] rounded-lg border border-slate-200 bg-slate-100" />
						}
					>
						{() => (
							<CampaignMapPreview area={campaign.area} coverage={coverage} />
						)}
					</ClientOnly>
					<div className="rounded-lg border border-slate-200 bg-white p-4">
						<div className="flex items-start gap-3">
							<div className="rounded-full bg-green-50 p-2 text-green-700">
								<Bookmark className="h-4 w-4" />
							</div>
							<div>
								<h2 className="font-semibold text-slate-950">
									{t('bookmark_campaign')}
								</h2>
								<p className="mt-1 text-sm text-slate-600">
									{t('bookmark_campaign_description')}
								</p>
								<p className="mt-2 text-sm font-medium text-slate-700">
									{t('bookmark_count', { count: bookmarkCount })}
								</p>
							</div>
						</div>
						{isLoggedIn ? (
							<Form method="post" className="mt-4">
								<input
									type="hidden"
									name="intent"
									value={isBookmarked ? 'remove-bookmark' : 'bookmark'}
								/>
								<Button
									type="submit"
									variant={isBookmarked ? 'outline' : 'default'}
									disabled={isBookmarkSubmitting}
									className="w-full"
								>
									{getBookmarkButtonLabel({
										isBookmarkSubmitting,
										isBookmarked,
										t,
									})}
								</Button>
							</Form>
						) : (
							<Button asChild variant="outline" className="mt-4 w-full">
								<Link
									to={`/explore/login?redirectTo=/campaigns/${campaign.slug}`}
								>
									{t('login_to_bookmark')}
								</Link>
							</Button>
						)}
					</div>
					<div className="rounded-lg border border-slate-200 bg-white p-4">
						<h2 className="font-semibold text-slate-950">{t('coverage')}</h2>
						<div className="mt-4 grid grid-cols-2 gap-3">
							<SummaryValue
								label={t('coverage_complete')}
								value={`${coverage.summary.coveragePercent}%`}
							/>
							<SummaryValue
								label={t('matching_devices')}
								value={coverage.summary.matchingDeviceCount}
							/>
							<SummaryValue
								label={t('matching_measurements')}
								value={coverage.summary.matchingMeasurementCount}
							/>
							<SummaryValue
								label={t('cells')}
								value={`${coverage.summary.completeCells}/${coverage.summary.totalCells}`}
							/>
						</div>
						<p className="mt-4 text-sm text-slate-600">
							{t('measurements_note_text')}
						</p>
						<Button asChild variant="outline" className="mt-4 w-full">
							<Link to="/explore">{t('explore_measurements')}</Link>
						</Button>
					</div>
				</aside>
			</main>
		</div>
	)
}

function RequirementValue({
	label,
	value,
}: {
	label: string
	value: string | number
}) {
	return (
		<div className="rounded-md bg-slate-50 p-4">
			<dt className="text-sm text-slate-500">{label}</dt>
			<dd className="mt-1 text-lg font-semibold text-slate-950">{value}</dd>
		</div>
	)
}

function SummaryValue({
	label,
	value,
}: {
	label: string
	value: string | number
}) {
	return (
		<div className="rounded-md bg-slate-50 p-3">
			<div className="text-xs text-slate-500">{label}</div>
			<div className="mt-1 text-lg font-semibold text-slate-950">{value}</div>
		</div>
	)
}

function getBookmarkButtonLabel({
	isBookmarkSubmitting,
	isBookmarked,
	t,
}: {
	isBookmarkSubmitting: boolean
	isBookmarked: boolean
	t: TFunction<'campaigns'>
}) {
	if (isBookmarkSubmitting) {
		return isBookmarked ? t('removing_bookmark') : t('saving_bookmark')
	}

	return isBookmarked ? t('remove_bookmark') : t('add_bookmark')
}

function formatDateRange(
	startDate: string | Date | null,
	endDate: string | Date | null,
) {
	if (!startDate && !endDate) return 'No date limit'
	if (startDate && !endDate) return `From ${formatDate(startDate)}`
	if (!startDate && endDate) return `Until ${formatDate(endDate)}`

	return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

function formatDate(date: string | Date | null) {
	if (!date) return ''
	return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
		new Date(date),
	)
}
