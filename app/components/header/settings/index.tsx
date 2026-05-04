import {
	SettingsIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from 'react-router'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '~/components/ui/button'

export default function Settings() {
	const [open, setOpen] = useState(false)
	const navigation = useNavigation()

	const { t } = useTranslation('menu')

	return (
		<DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
			<DropdownMenuTrigger asChild>
				<div className="pointer-events-auto box-border h-10 w-10">
					<Button variant="topbar">
						<SettingsIcon />
					</Button>
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-56 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95"
				align="end"
				forceMount
			>
				<div
					className={
						navigation.state === 'loading' ? 'pointer-events-none' : ''
					}
				>
				
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
