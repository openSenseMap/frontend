export function getUserImgSrc(imageId?: string | null) {
	return `/resources/file/${imageId}`
}

export function getErrorMessage(error: unknown) {
	if (typeof error === 'string') return error
	if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof error.message === 'string'
	) {
		return error.message
	}
	console.error('Unable to get error message for error', error)
	return 'Unknown Error'
}

export function getInitials(string: string) {
	if (!string) return ''
	let names = string.split(' ')
	let initials = names.at(0)?.substring(0, 1).toUpperCase() ?? '??'

	if (names.length > 1) {
		initials += names.at(-1)?.substring(0, 1).toUpperCase() ?? '?'
	}
	return initials
}
