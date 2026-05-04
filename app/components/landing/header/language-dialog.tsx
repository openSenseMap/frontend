import { Check, Languages } from 'lucide-react'
import { useFetcher } from 'react-router'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useRootRouteLoaderData } from '~/root'

type LanguageDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
}

const languages = [
	{
		locale: 'en',
		label: 'English',
		nativeLabel: 'English',
	},
	{
		locale: 'de',
		label: 'German',
		nativeLabel: 'Deutsch',
	},
] as const

export default function LanguageDialog({
	open,
	onOpenChange,
}: LanguageDialogProps) {
	const { locale } = useRootRouteLoaderData()
	const fetcher = useFetcher()

	const isSubmitting = fetcher.state !== 'idle'

	const changeLanguage = (newLocale: 'en' | 'de') => {
		if (newLocale === locale) {
			onOpenChange(false)
			return
		}

		void fetcher.submit(
			{ 'set-language': newLocale },
			{ method: 'post', action: '/' },
		)

		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Languages className="h-5 w-5" />
						Language
					</DialogTitle>
					<DialogDescription>
						Choose the language you want to use in the application.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-2">
					{languages.map((language) => {
						const isActive = language.locale === locale

						return (
							<Button
								key={language.locale}
								type="button"
								variant="ghost"
								disabled={isSubmitting}
								onClick={() => changeLanguage(language.locale)}
								className={cn(
									'h-auto justify-between rounded-lg border px-4 py-3 text-left',
									isActive
										? 'border-primary bg-primary/5'
										: 'border-border',
								)}
							>
								<span className="flex flex-col">
									<span className="font-medium">{language.nativeLabel}</span>
									<span className="text-muted-foreground text-sm">
										{language.label}
									</span>
								</span>

								{isActive ? <Check className="h-4 w-4" /> : null}
							</Button>
						)
					})}
				</div>
			</DialogContent>
		</Dialog>
	)
}