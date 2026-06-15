import { useTranslation } from 'react-i18next'
import { LanguageSelect } from '~/components/language-select'
import { ThemeSelect } from '~/components/theme-select'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

export default function PreferencesSettingsPage() {
	const { t } = useTranslation('settings')

	return (
		<Card className="border-border bg-card text-card-foreground">
			<CardHeader>
				<CardTitle>{t('preferences')}</CardTitle>
			</CardHeader>

			<CardContent className="divide-border divide-y">
				<div className="flex items-center justify-between gap-4 py-4 first:pt-0">
					<div>
						<div className="text-foreground font-medium">{t('language')}</div>
					</div>

					<LanguageSelect />
				</div>

				<div className="flex items-center justify-between gap-4 py-4 last:pb-0">
					<div>
						<div className="text-foreground font-medium">{t('theme')}</div>
						<div className="text-muted-foreground text-sm">
							{t('theme_description')}
						</div>
					</div>

					<ThemeSelect />
				</div>
			</CardContent>
		</Card>
	)
}
