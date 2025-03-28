'use client'

import { NavLink } from 'react-router'
import { cn } from '~/lib/utils'

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
	items: {
		href: string
		title: string
		icon?: any
		separator?: boolean
	}[]
	setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function SidebarNav({
	className,
	items,
	setOpen,
	...props
}: SidebarNavProps) {
	return (
		<nav
			className={cn(
				'flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1',
				className,
			)}
			{...props}
		>
			{items.map((item) => (
				<>
					<NavLink
						key={item.href}
						to={item.href}
						onClick={() => {
							setOpen(false)
						}}
						className={({ isPending }) =>
							isPending ? '' : 'hover:bg-transparent hover:underline'
						}
					>
						<div className="my-1 flex">
							{item.icon && item.icon} &nbsp;
							{item.title}
						</div>
					</NavLink>
					{item?.separator && (
						<hr className="my-4 mt-6 h-px border-0 bg-[#dcdada]" />
					)}
				</>
			))}
		</nav>
	)
}
