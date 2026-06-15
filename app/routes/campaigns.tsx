import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Form, Link, useLoaderData } from 'react-router'
import { type Route } from './+types/campaigns'
import { CampaignCard } from '~/components/campaigns/campaign-card'
import { NavBar } from '~/components/nav-bar'
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
import { getCampaigns } from '~/db/models/campaign.server'
import { getPhenomena } from '~/db/models/phenomena.server'
import { getUserId } from '~/services/session-service.server'

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url)
	const query = url.searchParams.get('q')?.trim() || undefined
	const rawPhenomenon = url.searchParams.get('phenomenon') || undefined
	const rawStatus = url.searchParams.get('status') || undefined
	const phenomenon =
		rawPhenomenon && rawPhenomenon !== 'all' ? rawPhenomenon : undefined
	const status = rawStatus && rawStatus !== 'all' ? rawStatus : undefined
	const userId = await getUserId(request)

	const [campaigns, phenomena] = await Promise.all([
		getCampaigns({
			query,
			phenomenon,
			status:
				status === 'active' || status === 'upcoming' || status === 'ended'
					? status
					: undefined,
		}),
		getPhenomena(),
	])

	return {
		campaigns,
		phenomena,
		filters: {
			query: query ?? '',
			phenomenon: phenomenon ?? 'all',
			status: status ?? 'all',
		},
		isLoggedIn: Boolean(userId),
	}
}

export default function CampaignsPage() {
	const { campaigns, phenomena, filters, isLoggedIn } =
		useLoaderData<typeof loader>()
	const { t } = useTranslation('campaigns')

	return (
		<div className="min-h-screen bg-slate-50">
			<NavBar />
			<main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
				<section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<p className="text-sm font-medium text-green-700">
							{t('campaigns')}
						</p>
						<h1 className="text-3xl font-semibold tracking-tight text-slate-950">
							{t('campaign_listing_title')}
						</h1>
						<p className="mt-2 max-w-2xl text-slate-600">
							{t('campaign_listing_description')}
						</p>
					</div>
					{isLoggedIn ? (
						<Button asChild>
							<Link to="/campaigns/new">{t('create_campaign')}</Link>
						</Button>
					) : (
						<Button asChild variant="outline">
							<Link to="/explore/login?redirectTo=/campaigns/new">
								{t('login_to_create')}
							</Link>
						</Button>
					)}
				</section>

				<Form
					method="get"
					className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_220px_180px_auto]"
				>
					<div className="space-y-2">
						<Label htmlFor="q">{t('search_campaigns')}</Label>
						<div className="relative">
							<Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
							<Input
								id="q"
								name="q"
								defaultValue={filters.query}
								className="pl-9"
								placeholder={t('search_placeholder')}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="phenomenon">{t('phenomenon')}</Label>
						<Select name="phenomenon" defaultValue={filters.phenomenon}>
							<SelectTrigger id="phenomenon">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t('all_phenomena')}</SelectItem>
								{phenomena.map((phenomenon) => (
									<SelectItem key={phenomenon} value={phenomenon}>
										{phenomenon}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="status">{t('status')}</Label>
						<Select name="status" defaultValue={filters.status}>
							<SelectTrigger id="status">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t('all_statuses')}</SelectItem>
								<SelectItem value="active">{t('active')}</SelectItem>
								<SelectItem value="upcoming">{t('upcoming')}</SelectItem>
								<SelectItem value="ended">{t('ended')}</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<Button type="submit" className="self-end">
						{t('apply_filters')}
					</Button>
				</Form>

				{campaigns.length > 0 ? (
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						{campaigns.map((campaign) => (
							<CampaignCard key={campaign.id} campaign={campaign} />
						))}
					</div>
				) : (
					<div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
						<h2 className="text-xl font-semibold text-slate-950">
							{t('no_campaigns_title')}
						</h2>
						<p className="mt-2 text-slate-600">{t('no_campaigns_text')}</p>
					</div>
				)}
			</main>
		</div>
	)
}
