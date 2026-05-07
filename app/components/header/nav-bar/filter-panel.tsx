import { X } from 'lucide-react'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigation, useSearchParams } from 'react-router'
import { NavbarContext } from '.'
import Spinner from '~/components/spinner'
import { Button } from '~/components/ui/button'
import {
	type DeviceExposureType,
	type DeviceStatusType,
} from '~/db/schema/enum'
import FilterOptions from './filter-options/filter-options'
import FilterTags from './filter-options/filter-tags'
import { useRouteLoaderData } from 'react-router'
import type { loader as exploreLoader } from '~/routes/explore'

type ExposureFilterValue = DeviceExposureType[]
type StatusFilterValue = DeviceStatusType[]

function parseCsvParam<T extends string>(
	searchParams: URLSearchParams,
	key: string,
): T[] {
	const values = searchParams
		.getAll(key)
		.flatMap((value) => value.split(','))
		.map((value) => value.trim())
		.filter(Boolean)
		.filter((value) => value !== 'all')

	return values as T[]
}

function serializeFilters({
	searchParams,
	exposure,
	status,
	tags,
}: {
	searchParams: URLSearchParams
	exposure: ExposureFilterValue
	status: StatusFilterValue
	tags: string[]
}) {
	const nextParams = new URLSearchParams(searchParams)

	nextParams.delete('exposure')
	nextParams.delete('status')
	nextParams.delete('tags')

	if (exposure.length > 0) {
		nextParams.set('exposure', exposure.join(','))
	}

	if (status.length > 0) {
		nextParams.set('status', status.join(','))
	}

	if (tags.length > 0) {
		nextParams.set('tags', tags.join(','))
	}

	return nextParams
}

export default function FilterPanel() {
	const { setOpen } = useContext(NavbarContext)
	const [searchParams, setSearchParams] = useSearchParams()
	const navigation = useNavigation()
	const data = useRouteLoaderData<typeof exploreLoader>('routes/explore')

	const currentExposure = useMemo(
		() => parseCsvParam<DeviceExposureType>(searchParams, 'exposure'),
		[searchParams],
	)

	const currentStatus = useMemo(
		() => parseCsvParam<DeviceStatusType>(searchParams, 'status'),
		[searchParams],
	)

	const currentTags = useMemo(
		() => parseCsvParam<string>(searchParams, 'tags'),
		[searchParams],
	)

	const [draftExposure, setDraftExposure] =
		useState<ExposureFilterValue>(currentExposure)
	const [draftStatus, setDraftStatus] =
		useState<StatusFilterValue>(currentStatus)
	const [draftTags, setDraftTags] = useState<string[]>(currentTags)
	

	useEffect(() => {
		setDraftExposure(currentExposure)
		setDraftStatus(currentStatus)
		setDraftTags(currentTags)
	}, [currentExposure, currentStatus, currentTags])

	const isChanged =
		JSON.stringify(draftExposure) !== JSON.stringify(currentExposure) ||
		JSON.stringify(draftStatus) !== JSON.stringify(currentStatus) ||
		JSON.stringify(draftTags) !== JSON.stringify(currentTags)

	const handleApplyChanges = () => {
		const nextParams = serializeFilters({
			searchParams,
			exposure: draftExposure,
			status: draftStatus,
			tags: draftTags,
		})

		setSearchParams(nextParams)
		setOpen(false)
	}

	const handleResetFilters = () => {
		setDraftExposure([])
		setDraftStatus([])
		setDraftTags([])

		const nextParams = new URLSearchParams(searchParams)
		nextParams.delete('exposure')
		nextParams.delete('status')
		nextParams.delete('tags')

		setSearchParams(nextParams)
	}

	return (
		<div className="relative py-2 dark:text-zinc-200">
			{navigation.state === 'loading' && (
				<div className="absolute inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-xs dark:bg-zinc-800/30">
					<Spinner />
				</div>
			)}

			<div className="flex max-h-[min(56vh,24rem)] flex-col gap-3 overflow-y-auto">
				<FilterOptions
					exposure={draftExposure}
					status={draftStatus}
					onExposureChange={setDraftExposure}
					onStatusChange={setDraftStatus}
				/>

				<FilterTags tags={draftTags} availableTags={data?.availableTags}
						onTagsChange={setDraftTags} />
			</div>

			<div className="mt-3 flex justify-end gap-2 border-t border-black/5 pt-3 dark:border-white/10">
				<Button
					variant="outline"
					className="h-8 rounded-md px-2 text-sm"
					onClick={handleResetFilters}
				>
					<X className="mr-1 h-3.5 w-3.5" />
					Reset
				</Button>

				<Button
					className="h-8 rounded-md px-3 text-sm"
					onClick={handleApplyChanges}
					disabled={!isChanged}
				>
					Apply
				</Button>
			</div>
		</div>
	)
}