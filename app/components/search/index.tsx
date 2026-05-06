import getUserLocale from 'get-user-locale'
import { useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import SearchList from './search-list'
import { searchNominatimLocations } from './nominatim'
import {
	DeviceFeatureCollection,
	DeviceSearchResult,
	LocationSearchResult,
} from './search-types'

interface SearchProps {
	searchString: string
	devices: DeviceFeatureCollection
}

function getDeviceResults(
	searchString: string,
	devices: DeviceFeatureCollection,
): DeviceSearchResult[] {
	const normalizedSearch = searchString.toLowerCase().trim()

	if (!normalizedSearch) return []

	return devices.features
		.filter((device) => {
			const name = device.properties.name.toLowerCase()
			const id = device.properties.id.toLowerCase()

			return name.includes(normalizedSearch) || id.includes(normalizedSearch)
		})
		.slice(0, 4)
		.map((device) => ({
			type: 'device',
			id: device.properties.id,
			displayName: device.properties.name,
			deviceId: device.properties.id,
			lng: device.properties.longitude,
			lat: device.properties.latitude,
		}))
}

export default function Search(props: SearchProps) {
	const { t } = useTranslation('search')

	const userLocaleString = useMemo(
		() => getUserLocale()?.toString() || 'en',
		[],
	)

	const [searchResultsLocation, setSearchResultsLocation] = useState<
		LocationSearchResult[]
	>([])
	const [searchResultsDevice, setSearchResultsDevice] = useState<
		DeviceSearchResult[]
	>([])

	useEffect(() => {
		const query = props.searchString.trim()

		if (query.length < 2) {
			setSearchResultsLocation([])
			setSearchResultsDevice([])
			return
		}

		setSearchResultsDevice(getDeviceResults(query, props.devices))

		const controller = new AbortController()

		const timeoutId = window.setTimeout(() => {
			void searchNominatimLocations({
				query,
				locale: userLocaleString,
				signal: controller.signal,
			})
				.then(setSearchResultsLocation)
				.catch((error) => {
					if ((error as Error).name !== 'AbortError') {
						console.error('Location search error', error)
						setSearchResultsLocation([])
					}
				})
		}, 500)

		return () => {
			window.clearTimeout(timeoutId)
			controller.abort()
		}
	}, [props.searchString, props.devices, userLocaleString])

	if (searchResultsLocation.length === 0 && searchResultsDevice.length === 0) {
		return null
	}

	return (
		<div className="mt-2">
			<SearchList
				searchResultsLocation={searchResultsLocation}
				searchResultsDevice={searchResultsDevice}
			/>
			<div className="flex">
				<div className="text-center text-sm text-gray-500">
					<p>
						<Trans
							t={t}
							i18nKey="hint_select_result"
							components={[<kbd key="select_result"></kbd>]}
						/>
					</p>
				</div>
			</div>
		</div>
	)
}
