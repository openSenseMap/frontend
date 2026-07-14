import sharp, { type Sharp } from 'sharp'
import {
	isSanitizableImageType,
	type SanitizableImageType,
} from '~/lib/image-types'

export type SanitizedImage = {
	buffer: Buffer
	contentType: SanitizableImageType
	extension: string
}

const IMAGE_OUTPUTS: Record<
	SanitizableImageType,
	{
		extension: string
		encode: (image: Sharp) => Sharp
	}
> = {
	'image/jpeg': {
		extension: 'jpg',
		encode: (image) => image.jpeg(),
	},
	'image/png': {
		extension: 'png',
		encode: (image) => image.png(),
	},
	'image/webp': {
		extension: 'webp',
		encode: (image) => image.webp(),
	},
	'image/gif': {
		extension: 'gif',
		encode: (image) => image.gif(),
	},
}

export async function sanitizeImageFile(file: File): Promise<SanitizedImage> {
	if (!isSanitizableImageType(file.type)) {
		throw new Error(`Unsupported image type: ${file.type}`)
	}

	const input = Buffer.from(await file.arrayBuffer())
	const output = IMAGE_OUTPUTS[file.type]
	const image = sharp(input, { animated: file.type === 'image/gif' }).rotate()

	return {
		buffer: await output.encode(image).toBuffer(),
		contentType: file.type,
		extension: output.extension,
	}
}
