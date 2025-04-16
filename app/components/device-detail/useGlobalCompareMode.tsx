import { useEffect, useState } from 'react'

let globalValue = false // Shared global state
let listeners: ((value: boolean) => void)[] = [] // Listeners for updates

export const useGlobalCompareMode = () => {
	const [compareMode, setCompareMode] = useState(globalValue)

	// Function to update the global value and notify listeners
	const updateValue = (newValue: boolean) => {
		globalValue = newValue
		listeners.forEach((listener) => listener(newValue))
	}

	// Subscribe to global state updates
	const subscribe = (listener: (value: boolean) => void) => {
		listeners.push(listener)
		return () => {
			listeners = listeners.filter((l) => l !== listener)
		}
	}

	// Effect to keep the local state synced with the global state
	useEffect(() => {
		const unsubscribe = subscribe(setCompareMode)
		return unsubscribe // Clean up on unmount
	}, [])

	return [compareMode, updateValue] as const
}
