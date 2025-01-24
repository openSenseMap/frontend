import { Hash } from 'lucide-react'
import { Badge } from '../ui/badge'
import clsx from 'clsx'
import { useNavigate, useSearchParams } from 'react-router'

export default function DeviceTags({ tags }: { tags: string[] }) {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()

	return (
		<>
			{tags && tags.length > 0 && (
				<div className="pt-4">
					<div className="space-y-2">
						<div className="text-sm font-medium text-muted-foreground">
							Tags
						</div>
						<div className="flex items-center space-x-2">
							<Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
							<div className="flex flex-wrap gap-2">
								{tags.map((tag: string) => (
									<Badge
										key={tag}
										variant="secondary"
										className={clsx(
											'cursor-pointer text-xs font-medium',
											searchParams.get('tags')?.split(',').includes(tag)
												? 'bg-green-100 dark:bg-dark-green'
												: '',
										)}
										onClick={(event) => {
											event.stopPropagation()

											const currentParams = new URLSearchParams(
												searchParams.toString(),
											)

											// Safely retrieve and parse the current tags
											const currentTags =
												currentParams.get('tags')?.split(',') || []

											// Toggle the tag in the list
											const updatedTags = currentTags.includes(tag)
												? currentTags.filter((t) => t !== tag) // Remove if already present
												: [...currentTags, tag] // Add if not present

											// Update the tags parameter or remove it if empty
											if (updatedTags.length > 0) {
												currentParams.set('tags', updatedTags.join(','))
											} else {
												currentParams.delete('tags')
											}

											// Update the URL with the new search params
											void navigate({
												search: currentParams.toString(),
											})
										}}
									>
										{tag}
									</Badge>
								))}
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
