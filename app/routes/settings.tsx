import { useTranslation } from 'react-i18next'
import { Link, Outlet, useLocation } from 'react-router'
import { NavBar } from '~/components/nav-bar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

export default function SettingsLayoutPage() {
	const location = useLocation()
	// get current tab from the URL
	const currentTab = location.pathname.split('/')[2] || 'account'

	const { t } = useTranslation('settings')

	return (
		<div className="bg-background text-foreground min-h-screen">
			<NavBar />
			<div className="bg-background flex w-full items-start justify-center py-10">
				<div className="w-full max-w-3xl rounded-lg bg-transparent p-6">
					<Tabs className="w-full" defaultValue="account" value={currentTab}>
						<TabsList className="w-full justify-evenly">
							<TabsTrigger value="profile" asChild>
								<Link to="/settings/profile">{t('public_profile')}</Link>
							</TabsTrigger>

							<TabsTrigger value="account" asChild>
								<Link to="/settings/account">{t('account')}</Link>
							</TabsTrigger>

							<TabsTrigger value="preferences" asChild>
								<Link to="/settings/preferences">{t('preferences')}</Link>
							</TabsTrigger>

							<TabsTrigger
								value="delete"
								className="data-[state=active]:text-destructive"
								asChild
							>
								<Link to="/settings/delete">{t('delete_account')}</Link>
							</TabsTrigger>
						</TabsList>
						<TabsContent className="mt-6" value={currentTab}>
							<Outlet />
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	)
}
