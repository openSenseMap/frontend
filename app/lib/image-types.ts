export const SANITIZABLE_IMAGE_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
] as const

export type SanitizableImageType = (typeof SANITIZABLE_IMAGE_TYPES)[number]

export function isSanitizableImageType(
	contentType: string,
): contentType is SanitizableImageType {
	return SANITIZABLE_IMAGE_TYPES.includes(contentType as SanitizableImageType)
}
