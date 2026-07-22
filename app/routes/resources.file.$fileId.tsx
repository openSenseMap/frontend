import invariant from 'tiny-invariant'
import { type Route } from './+types/resources.file.$fileId'
import { drizzleClient } from '~/db.server'

export async function loader({ params }: Route.LoaderArgs) {
	invariant(params.fileId, 'File ID is required')

	// Keep it as a string - your ID column is PgText, not an integer
	const image = await drizzleClient.query.profileImage.findFirst({
		where: { id: params.fileId as string },
	})

	if (!image || !image.blob) {
		throw new Response('Not found', { status: 404 })
	}

	// Convert Buffer to Uint8Array
	const body = new Uint8Array(image.blob)

	return new Response(body, {
		headers: {
			'Content-Type': image.contentType || 'image/jpeg',
			'Content-Length': body.byteLength.toString(),
			'Content-Disposition': `inline; filename="profile-${params.fileId}"`,
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	})
}
