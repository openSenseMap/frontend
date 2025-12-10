import { LogIn, Mailbox, Plus } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import Menu from './header/menu'
import { Button } from './ui/button'

import {
	DropdownMenu,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useOptionalUser } from '~/utils'

export function NavBar() {
	const location = useLocation()
	const parts = location.pathname
		.split('/')
		.slice(1)
		.map((item) => {
			const decoded = decodeURIComponent(item)
			return decoded.charAt(0).toUpperCase() + decoded.slice(1)
		})// prevents empty parts from showing

	// User is optional
	// If no user render Login button
	const user = useOptionalUser()

	return (
		<div className="border-b bg-white p-4 dark:bg-dark-background dark:text-dark-text">
			<div className="flex h-16 items-center justify-between">
				<div className="flex max-w-screen-xl flex-wrap items-center justify-between">
					<Link to="/" className="flex items-center md:pr-4">
						<img src="/logo.png" className="mr-3 h-6 sm:h-9" alt="osem Logo" />
					</Link>
					<span className="hidden self-center whitespace-nowrap text-xl font-semibold text-light-green dark:text-dark-green md:block">
						{parts.join(' / ')}
					</span>
				</div>
				<div className="flex items-center gap-2">
					{user ? (
						<>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="icon" className="mx-2">
										<Plus className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>

								<DropdownMenuContent
									align="end"
									forceMount
									className="dark:bg-dark-background dark:text-dark-text"
								>
									<DropdownMenuGroup>
										<Link to="/device/new">
											<DropdownMenuItem>
												<span>New device</span>
											</DropdownMenuItem>
										</Link>

										<Link to="/device/transfer">
											<DropdownMenuItem disabled>
												<span>Transfer device</span>
											</DropdownMenuItem>
										</Link>
									</DropdownMenuGroup>
								</DropdownMenuContent>
							</DropdownMenu>

							<Button variant="outline" size="icon" disabled>
								<Mailbox className="h-4 w-4" />
							</Button>

							<div className="px-8">
								<Menu />
							</div>
						</>
					) : (
						<div className="px-8">
							<div className="pointer-events-auto box-border h-10 w-10">
								<button
									type="button"
									className="h-10 w-10 rounded-full border border-gray-100 bg-white text-center text-black hover:bg-gray-100"
								>
									<Link to="/login">
										<LogIn className="mx-auto h-6 w-6" />
									</Link>
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
