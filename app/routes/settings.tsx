import { useTranslation } from 'react-i18next'
import { Link, Outlet, useLocation } from 'react-router'
import { NavBar } from '~/components/nav-bar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

export default function SettingsLayoutPage() {
	const location = useLocation()
	// get current tab from the URL
	const currentTab = location.pathname.split('/')[2]

	const { t } = useTranslation('settings')

	return (
		<div className="bg-background text-foreground min-h-screen">
			<NavBar />
			<div className="bg-background flex w-full items-start justify-center py-10">
				<div className="w-full max-w-3xl rounded-lg bg-transparent p-6">
					<Tabs
						className="w-full"
						defaultValue="account"
						value={currentTab || 'account'}
					>
						<TabsList className="w-full justify-evenly">
							<TabsTrigger
								className="data-[state=active]:text-light-green"
								value="profile"
							>
								<Link to={`/settings/profile`}>{t('public_profile')}</Link>
							</TabsTrigger>
							<TabsTrigger
								className="data-[state=active]:text-light-green"
								value="account"
							>
								<Link to={`/settings/account`}>{t('account')}</Link>
							</TabsTrigger>
							<TabsTrigger
								className="data-[state=active]:text-primary"
								value="preferences"
							>
								<Link to="/settings/preferences">{t('preferences')}</Link>
							</TabsTrigger>
							<TabsTrigger
								className="data-[state=active]:text-light-green"
								value="delete"
							>
								<Link to={`/settings/delete`}>{t('delete_account')}</Link>
							</TabsTrigger>
						</TabsList>
						<TabsContent className="mt-6" value={currentTab || 'profile'}>
							<Outlet />
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	)
}
