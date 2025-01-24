import { Archive, EllipsisVertical, ExternalLink, Scale } from 'lucide-react'
import { Button } from '../ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Link } from 'react-router'
import { getArchiveLink } from '~/utils/device'

export default function DeviceOptions({
	id,
	name,
	link,
}: {
	id: string
	name: string
	link: string | null
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="h-8 w-8 p-0">
					<span className="sr-only">Open menu</span>
					<EllipsisVertical className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="dark:bg-dark-background dark:text-dark-text"
			>
				<DropdownMenuLabel>Actions</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem className="cursor-pointer">
					<Link
						to={`/explore/${id}/compare`}
						className="flex w-full items-center"
					>
						<Scale className="mr-2 h-4 w-4" />
						<span>Compare</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem disabled={link === null}>
					<Archive className="mr-2 h-4 w-4" />
					<span>
						<a
							href={getArchiveLink({ name, id })}
							target="_blank"
							rel="noopener noreferrer"
							title="Open archive"
							className="w-full cursor-pointer"
						>
							Archive
						</a>
					</span>
				</DropdownMenuItem>
				<DropdownMenuItem>
					<ExternalLink className="mr-2 h-4 w-4" />
					<span>
						<a
							href={link || '#'}
							target="_blank"
							rel="noopener noreferrer"
							title="Open external link"
							className="w-full cursor-pointer"
						>
							External Link
						</a>
					</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
