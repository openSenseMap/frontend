import { Cpu, Globe, MapPin } from 'lucide-react'
import { useState, useEffect, useCallback, useContext } from 'react'
import { useMap } from 'react-map-gl'
import { useMatches, useNavigate, useSearchParams } from 'react-router'

import { NavbarContext } from '../header/nav-bar'
import useKeyboardNav from '../header/nav-bar/use-keyboard-nav'
import SearchListItem from './search-list-item'
import { goTo } from '~/lib/search-map-helper'
import { useGlobalCompareMode } from '../device-detail/useGlobalCompareMode'

interface SearchListProps {
	searchResultsLocation: any[]
	searchResultsDevice: any[]
}

export default function SearchList(props: SearchListProps) {
	const { osem } = useMap()
	const navigate = useNavigate()
	const { setOpen } = useContext(NavbarContext)
	const [compareMode] = useGlobalCompareMode()
	const matches = useMatches()

	const { cursor, setCursor, enterPress, controlPress } = useKeyboardNav(
		0,
		0,
		props.searchResultsDevice.length + props.searchResultsLocation.length,
	)

	const length =
		props.searchResultsDevice.length + props.searchResultsLocation.length
	const searchResultsAll = props.searchResultsDevice.concat(
		props.searchResultsLocation,
	)
	const [selected, setSelected] = useState(searchResultsAll[cursor])
	const [searchParams] = useSearchParams()
	const [navigateTo, setNavigateTo] = useState(
		compareMode
			? `/explore/${matches[2].params.deviceId}/compare/${selected.deviceId}`
			: selected.type === 'device'
				? `/explore/${selected.deviceId + '?' + searchParams.toString()}}`
				: `/explore?${searchParams.toString()}`,
	)

	const handleNavigate = useCallback(
		(result: any) => {
			return compareMode
				? `/explore/${matches[2].params.deviceId}/compare/${selected.deviceId}`
				: result.type === 'device'
					? `/explore/${result.deviceId + '?' + searchParams.toString()}`
					: `/explore?${searchParams.toString()}`
		},
		[searchParams, compareMode, matches, selected],
	)

	const setShowSearchCallback = useCallback(
		(state: boolean) => {
			setOpen(state)
		},
		[setOpen],
	)

	const handleDigitPress = useCallback(
		(event: any) => {
			if (
				typeof Number(event.key) === 'number' &&
				Number(event.key) <= length &&
				controlPress
			) {
				event.preventDefault()
				setCursor(Number(event.key) - 1)
				goTo(osem, searchResultsAll[Number(event.key) - 1])
				setTimeout(() => {
					setShowSearchCallback(false)
					void navigate(handleNavigate(searchResultsAll[Number(event.key) - 1]))
				}, 500)
			}
		},
		[
			controlPress,
			length,
			navigate,
			osem,
			searchResultsAll,
			setCursor,
			setShowSearchCallback,
			handleNavigate,
		],
	)

	useEffect(() => {
		setSelected(searchResultsAll[cursor])
	}, [cursor, searchResultsAll])

	useEffect(() => {
		const navigate = handleNavigate(selected)
		setNavigateTo(navigate)
	}, [selected, handleNavigate])

	useEffect(() => {
		if (length !== 0 && enterPress) {
			goTo(osem, selected)
			setShowSearchCallback(false)
			void navigate(navigateTo)
		}
	}, [
		enterPress,
		osem,
		navigate,
		selected,
		setShowSearchCallback,
		navigateTo,
		length,
	])

	useEffect(() => {
		// attach the event listener
		window.addEventListener('keydown', handleDigitPress)

		// remove the event listener
		return () => {
			window.removeEventListener('keydown', handleDigitPress)
		}
	})

	return (
		<div className="w-full overflow-visible rounded-[1.25rem] bg-white pb-2 text-black dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-90">
			{props.searchResultsDevice.length > 0 && (
				<hr className="solid mx-2 mb-2 border-t-2" />
			)}
			{props.searchResultsDevice.map((device: any, i) => (
				<SearchListItem
					key={device.deviceId}
					index={i}
					active={i === cursor}
					name={device.display_name}
					icon={Cpu}
					controlPress={controlPress}
					onMouseEnter={() => setCursor(i)}
					onClick={() => {
						goTo(osem, device)
						setShowSearchCallback(false)
						void navigate(navigateTo)
					}}
				/>
			))}
			{props.searchResultsLocation.length > 0 && (
				<hr className="solid m-2 border-t-2" />
			)}
			{props.searchResultsLocation.map((location: any, i) => {
				return (
					<SearchListItem
						key={location.id}
						index={i + props.searchResultsDevice.length}
						active={i + props.searchResultsDevice.length === cursor}
						name={location.place_name}
						icon={location.place_type.includes('country') ? Globe : MapPin}
						controlPress={controlPress}
						onMouseEnter={() => setCursor(i + props.searchResultsDevice.length)}
						onClick={() => {
							goTo(osem, location)
							setShowSearchCallback(false)
							void navigate(navigateTo)
						}}
					/>
				)
			})}
		</div>
	)
}
