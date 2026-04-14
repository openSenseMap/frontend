import { Plus, X } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { useNavigation, useSearchParams } from 'react-router'
import { NavbarContext } from '..'
import Spinner from '~/components/spinner'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

export default function FilterTags() {
	const { setOpen } = useContext(NavbarContext)
	const [searchParams, setSearchParams] = useSearchParams()
	const navigation = useNavigation()

	const [tags, setTags] = useState<string[]>(
		searchParams.getAll('tags').flatMap((t) => t.split(',')),
	)
	const [newTag, setNewTag] = useState('')
	const [isChanged, setIsChanged] = useState(false)

	useEffect(() => {
		setTags(searchParams.getAll('tags').flatMap((t) => t.split(',')))
	}, [searchParams])

	useEffect(() => {
		const currentTags = searchParams.getAll('tags').flatMap((t) => t.split(','))
		setIsChanged(JSON.stringify(tags) !== JSON.stringify(currentTags))
	}, [tags, searchParams])

	const handleApplyChanges = () => {
		searchParams.delete('tags')
		if (tags.length > 0) {
			// Join all tags into a single string separated by commas
			searchParams.set('tags', tags.join(','))
		}
		setSearchParams(searchParams)
		setIsChanged(false)
		setOpen(false)
	}

	const handleResetFilters = () => {
		setTags([])
		searchParams.delete('tags')
		setSearchParams(searchParams)
		setIsChanged(false)
	}

	const handleAddTag = () => {
		if (newTag && !tags.includes(newTag)) {
			setTags([...tags, newTag])
			setNewTag('')
		}
	}

	const handleRemoveTag = (tagToRemove: string) => {
		setTags(tags.filter((tag) => tag !== tagToRemove))
	}

	return (
		<div className="flex h-full flex-1 flex-col justify-around gap-2 dark:text-zinc-200">
			{navigation.state === 'loading' && (
				<div className="bg-white/30 dark:bg-zinc-800/30 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
					<Spinner />
				</div>
			)}
			<div className="space-y-2">
				<Label htmlFor="tag-input" className="text-base">
					Tags:
				</Label>
				<div className="flex space-x-2">
					<Input
						id="tag-input"
						type="text"
						placeholder="Add a tag"
						value={newTag}
						onChange={(e) => setNewTag(e.target.value)}
						onKeyPress={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault()
								handleAddTag()
							}
						}}
					/>
					<Button
						variant={'outline'}
						onClick={handleAddTag}
						aria-label="Add tag"
					>
						<Plus className="h-4 w-4" />
					</Button>
				</div>
				<div className="flex flex-wrap gap-2 pt-2">
					{tags.map((tag, index) => (
						<Badge key={index} variant="secondary" className="text-sm">
							{tag}
							<button
								onClick={() => handleRemoveTag(tag)}
								className="ml-2 text-xs"
								aria-label={`Remove ${tag} tag`}
							>
								<X className="h-3 w-3" />
							</button>
						</Badge>
					))}
				</div>
			</div>
			<div className="flex justify-end gap-4 align-bottom">
				<Button
					variant="outline"
					className="rounded-[5px] border-[1px] border-[#e2e8f0] px-2 py-[1px] text-base"
					onClick={handleResetFilters}
				>
					<span className="flex items-center">
						<X className="m-0 inline h-3.5 w-3.5 p-0 align-sub" /> Reset
					</span>
				</Button>
				<Button
					className="rounded-[5px] px-2 py-[1px] text-base"
					onClick={handleApplyChanges}
					disabled={!isChanged}
				>
					Apply
				</Button>
			</div>
		</div>
	)
}
