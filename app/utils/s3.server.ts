import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
} from '@aws-sdk/client-s3'

const s3Client = new S3Client({
	endpoint: process.env.S3_ENDPOINT,
	region: process.env.S3_REGION || 'eu-north-1',
	credentials: {
		accessKeyId: process.env.S3_ACCESS_KEY!,
		secretAccessKey: process.env.S3_SECRET_KEY!,
	},
	forcePathStyle: true, // Required for MinIO
})

const BUCKET_NAME = process.env.S3_BUCKET || 'device-images'

export async function uploadDeviceImage(
	deviceId: string,
	file: File,
): Promise<string> {
	const fileExtension = file.name.split('.').pop()
	const key = `devices/${deviceId}.${fileExtension}`

	const buffer = Buffer.from(await file.arrayBuffer())

	await s3Client.send(
		new PutObjectCommand({
			Bucket: BUCKET_NAME,
			Key: key,
			Body: buffer,
			ContentType: file.type,
		}),
	)

	return `${process.env.S3_PUBLIC_URL}/${key}`
}

export async function deleteDeviceImage(imageUrl: string): Promise<void> {
	const key = imageUrl.split(`${BUCKET_NAME}/`)[1]
	if (!key) return

	await s3Client.send(
		new DeleteObjectCommand({
			Bucket: BUCKET_NAME,
			Key: key,
		}),
	)
}
