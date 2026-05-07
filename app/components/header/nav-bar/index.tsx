import { useMediaQuery } from '@mantine/hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { SearchIcon, XIcon } from 'lucide-react'
import { useState, useEffect, useRef, createContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useMap } from 'react-map-gl/maplibre'
import NavbarHandler from './nav-bar-handler'
import FilterVisualization from '~/components/map/filter-visualization'
import { type Device } from '~/db/schema'
import { cn } from '~/lib/utils'
import { topbarSurface } from '~/components/map/topbar-styles'

interface NavBarProps {
	devices: Device[]
}

export const NavbarContext = createContext({
	open: false,
	setOpen: (_open: boolean) => {},
})

export default function NavBar(props: NavBarProps) {
	const [open, setOpen] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const [searchString, setSearchString] = useState('')

	const { osem: mapRef } = useMap()

	const { t } = useTranslation('search')

	useEffect(() => {
		if (mapRef) {
			mapRef.on('click', () => setOpen(false))
		}
	}, [mapRef])

	// register keyboard shortcuts
	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault()
				setOpen((prevState) => !prevState)
			}
			if (e.key === 'Escape') {
				e.preventDefault()
				setOpen(false)
			}
		}
		document.addEventListener('keydown', down)
		return () => document.removeEventListener('keydown', down)
	}, [])

	useEffect(() => {
		if (open) {
			inputRef.current?.focus()
		} else {
			inputRef.current?.blur()
			setSearchString('')
		}
	}, [open])

	const isDesktop = useMediaQuery('(min-width: 768px)')

	return (
		<div className="pointer-events-auto relative w-full max-w-176">
			<motion.div
				layout
				className={cn(
					topbarSurface({ shape: 'panel' }),
					'w-full overflow-hidden px-3 md:px-4',
				)}
				animate={{
					borderRadius: open ? 16 : 999,
				}}
				transition={{
					layout: {
						duration: 0.24,
						ease: [0.22, 1, 0.36, 1],
					},
					borderRadius: {
						duration: 0.2,
						ease: [0.22, 1, 0.36, 1],
					},
				}}
			>
				<div className="flex h-11 w-full items-center gap-2 text-black md:gap-4 dark:text-zinc-200">
					<SearchIcon className="h-6 w-6 shrink-0 dark:text-zinc-200" />

					<input
						ref={inputRef}
						placeholder={t('placeholder') || undefined}
						onFocus={() => setOpen(true)}
						onChange={(e) => setSearchString(e.target.value)}
						className="h-full w-full flex-1 border-none bg-transparent focus:border-none focus:ring-0 focus:outline-hidden dark:text-zinc-200"
						value={searchString}
					/>

					{!open && (
						<span className="hidden flex-none text-xs font-semibold text-gray-400 md:block">
							<kbd>ctrl</kbd> + <kbd>K</kbd>
						</span>
					)}

					{open && (
						<button
							type="button"
							onClick={() => {
								setSearchString('')
								setOpen(false)
								inputRef.current?.blur()
							}}
							aria-label="Close search"
							className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
						>
							<XIcon className="h-5 w-5" />
						</button>
					)}
				</div>

				<NavbarContext.Provider value={{ open, setOpen }}>
					<AnimatePresence initial={false}>
						{open && (
							<motion.div
								key="search-results"
								className="overflow-hidden"
								initial={{
									opacity: 0,
									height: 0,
									y: -4,
								}}
								animate={{
									opacity: 1,
									height: 'auto',
									y: 0,
								}}
								exit={{
									opacity: 0,
									height: 0,
									y: -4,
								}}
								transition={{
									duration: 0.22,
									ease: [0.22, 1, 0.36, 1],
								}}
							>
								<div className="pt-2">
									<NavbarHandler
										devices={props.devices}
										searchString={searchString}
									/>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</NavbarContext.Provider>
			</motion.div>
			{!open && isDesktop && (
				<div className="flex w-full items-center justify-center">
					<FilterVisualization />
				</div>
			)}
		</div>
	)
}
