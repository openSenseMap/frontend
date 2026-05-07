import Search from '~/components/search'
import { type Device } from '~/db/schema'
import FilterPanel from './filter-panel'

interface NavBarHandlerProps {
	devices: Device[]
	searchString: string
}

export default function NavbarHandler({
	devices,
	searchString,
}: NavBarHandlerProps) {
	const isSearching = searchString.trim().length >= 2

	if (isSearching) {
		return <Search devices={devices} searchString={searchString} />
	}

	return <FilterPanel/>
}