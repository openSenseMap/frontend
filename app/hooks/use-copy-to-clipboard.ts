import { useCallback, useState } from 'react'

export function useCopyToClipboard(resetAfter = 2000) {
	const [copiedToClipboard, setCopiedToClipboard] = useState(false)

	const copyToClipboard = useCallback(
		async (value: string | undefined | null) => {
			if (!value) return false

			await navigator.clipboard.writeText(value)

			setCopiedToClipboard(true)

			window.setTimeout(() => {
				setCopiedToClipboard(false)
			}, resetAfter)

			return true
		},
		[resetAfter],
	)

	return {
		copiedToClipboard,
		copyToClipboard,
	}
}
