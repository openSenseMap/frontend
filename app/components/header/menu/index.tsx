import {
	LogIn,
	LogOut,
	User2,
	Settings,
	Compass,
	PlusIcon,
	DownloadIcon,
	Info,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	Form,
	Link,
	useMatches,
	useNavigation,
	useSearchParams,
} from 'react-router'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Spinner from '~/components/spinner'
import { toast } from '~/components/ui/use-toast'
import { useOptionalUser } from '~/utils'
import { Button } from '~/components/ui/button'
import Download from '../download'

interface MenuProps {
	devices?: any
}

export default function Menu({ devices }: MenuProps) {
	const [searchParams] = useSearchParams()
	const redirectTo =
		searchParams.size > 0 ? '/explore?' + searchParams.toString() : '/explore'

	const [open, setOpen] = useState(false)
	const [downloadOpen, setDownloadOpen] = useState(false)
	const logoutFormRef = useRef<HTMLFormElement>(null)

	const navigation = useNavigation()
	const isLoggingOut = Boolean(navigation.state === 'submitting')
	const user = useOptionalUser()
	const matches = useMatches()
	const { t } = useTranslation('menu')

	const isExplore = matches.some((match) => match.pathname === '/explore')

	return (
		<>
			<DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
				<DropdownMenuTrigger asChild>
					<Button
						variant="topbar"
						size="topbarIcon"
						className="pointer-events-auto size-11 lg:size-10"
						aria-label={t('user_menu', 'User menu')}
					>
						<User2 />
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					className="max-h-[calc(100dvh-1rem)] w-56 max-w-[calc(100vw-1rem)] overflow-x-hidden overflow-y-auto overscroll-contain dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95 [&_[role=menuitem]]:min-h-11 [&_[role=menuitem]]:touch-manipulation lg:[&_[role=menuitem]]:min-h-0"
					align="end"
					forceMount
				>
					<div
						className={
							navigation.state === 'loading' ? 'pointer-events-none' : ''
						}
					>
						<DropdownMenuLabel className="font-normal">
							{!user ? (
								<div className="flex flex-col space-y-1">
									<p className="text-sm leading-none font-medium">
										{t('title')}
									</p>
									<p className="text-muted-foreground text-xs leading-none">
										{t('subtitle')}
									</p>
								</div>
							) : (
								<div className="flex min-w-0 flex-col space-y-1 p-2">
									<p
										className="truncate text-sm leading-none font-medium"
										title={user?.name}
									>
										{user?.name}
									</p>
									<p
										className="text-muted-foreground truncate text-xs leading-none"
										title={user?.email}
									>
										{user?.email}
									</p>
								</div>
							)}
						</DropdownMenuLabel>

						<DropdownMenuSeparator />

						{user && (
							<DropdownMenuGroup>
								{navigation.state === 'loading' && (
									<div className="absolute inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-xs dark:bg-zinc-800/30">
										<Spinner />
									</div>
								)}

								<Link to="/about">
									<DropdownMenuItem className="cursor-pointer">
										<Info className="mr-2 h-5 w-5" />
										<span>{t('about_label')}</span>
									</DropdownMenuItem>
								</Link>
								{!isExplore && (
									<Link to="/explore">
										<DropdownMenuItem className="cursor-pointer">
											<Compass className="mr-2 h-5 w-5" />
											<span>{t('explore_label')}</span>
										</DropdownMenuItem>
									</Link>
								)}

								{matches[1]?.pathname !== '/settings' && (
									<Link to="/settings/profile">
										<DropdownMenuItem className="cursor-pointer">
											<Settings className="mr-2 h-5 w-5" />
											{t('settings_label')}
										</DropdownMenuItem>
									</Link>
								)}

								{matches[1]?.pathname !== '/profile' && (
									<Link to="/profile/me">
										<DropdownMenuItem className="cursor-pointer">
											<User2 className="mr-2 h-5 w-5" />
											{t('my_devices_label')}
										</DropdownMenuItem>
									</Link>
								)}

								{matches[1]?.pathname !== '/profile' && (
									<Link to="/device/new">
										<DropdownMenuItem className="cursor-pointer">
											<PlusIcon className="mr-2 h-5 w-5" />
											{t('add_device_label')}
										</DropdownMenuItem>
									</Link>
								)}
							</DropdownMenuGroup>
						)}

						{isExplore && (
							<DropdownMenuGroup>
								<DropdownMenuItem
									className="cursor-pointer"
									onSelect={(event) => {
										event.preventDefault()
										setOpen(false)
										setDownloadOpen(true)
									}}
								>
									<DownloadIcon className="mr-2 h-5 w-5" />
									<span>{t('download_label', 'Download data')}</span>
								</DropdownMenuItem>

								<DropdownMenuSeparator />
							</DropdownMenuGroup>
						)}

						<DropdownMenuGroup>
							{!user ? (
								<DropdownMenuItem asChild>
									<Link
										to={{
											pathname: 'login',
											search: searchParams.toString(),
										}}
										onClick={() => setOpen(false)}
										className="w-full cursor-pointer"
									>
										<LogIn className="mr-2 h-5 w-5 shrink-0" />
										<span className="text-light-green">{t('login_label')}</span>
									</Link>
								</DropdownMenuItem>
							) : (
								<Form
									ref={logoutFormRef}
									action="/logout"
									method="post"
									onSubmit={() => {
										setOpen(false)
										toast({
											description: 'Successfully logged out.',
										})
									}}
									className="w-full cursor-pointer"
								>
									<input type="hidden" name="redirectTo" value={redirectTo} />
									<DropdownMenuItem
										className="w-full cursor-pointer"
										disabled={isLoggingOut}
										onSelect={(event) => {
											event.preventDefault()
											logoutFormRef.current?.requestSubmit()
										}}
									>
										<LogOut className="mr-2 h-5 w-5 shrink-0" />
										<span className="text-red-500">{t('logout_label')}</span>
									</DropdownMenuItem>
								</Form>
							)}
						</DropdownMenuGroup>
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
			{devices && (
				<Download
					devices={devices}
					open={downloadOpen}
					onOpenChange={setDownloadOpen}
				/>
			)}
		</>
	)
}
