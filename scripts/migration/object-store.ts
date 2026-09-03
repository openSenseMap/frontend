import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat, realpath } from 'node:fs/promises'
import path from 'node:path'
import {
	HeadBucketCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3'

const CONTENT_TYPES: Record<string, string> = {
	'.gif': 'image/gif',
	'.jpeg': 'image/jpeg',
	'.jpg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
}

export type PreparedAsset = {
	sourcePath: string
	key: string
	sha256: string
	bytes: number
	contentType: string
}

async function hashFile(filename: string) {
	const hash = createHash('sha256')
	for await (const chunk of createReadStream(filename)) hash.update(chunk)
	return hash.digest('hex')
}

export class DeviceImageStore {
	private readonly client: S3Client

	constructor(
		private readonly imageRoot: string,
		private readonly bucket: string,
		options: {
			endpoint: string
			region: string
			accessKey: string
			secretKey: string
			forcePathStyle: boolean
		},
		private readonly dryRun: boolean,
	) {
		this.client = new S3Client({
			endpoint: options.endpoint,
			region: options.region,
			credentials: {
				accessKeyId: options.accessKey,
				secretAccessKey: options.secretKey,
			},
			forcePathStyle: options.forcePathStyle,
		})
	}

	async inspect() {
		await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }))
		const root = await realpath(this.imageRoot)
		return { bucket: this.bucket, imageRoot: root }
	}

	close() {
		this.client.destroy()
	}

	async prepare(
		deviceId: string,
		sourceFilename: string,
	): Promise<PreparedAsset> {
		if (
			!sourceFilename ||
			path.isAbsolute(sourceFilename) ||
			path.basename(sourceFilename) !== sourceFilename
		) {
			throw new Error('Legacy image filename is unsafe')
		}
		const root = await realpath(this.imageRoot)
		const sourcePath = path.resolve(root, sourceFilename)
		const relative = path.relative(root, sourcePath)
		if (relative.startsWith('..') || path.isAbsolute(relative)) {
			throw new Error('Legacy image escapes the configured image directory')
		}
		const sourceStat = await lstat(sourcePath)
		if (!sourceStat.isFile() || sourceStat.isSymbolicLink()) {
			throw new Error('Legacy image is not a regular file')
		}
		const resolved = await realpath(sourcePath)
		if (path.relative(root, resolved).startsWith('..')) {
			throw new Error('Legacy image resolves outside the configured directory')
		}
		const extension = path.extname(sourceFilename).toLowerCase()
		const contentType = CONTENT_TYPES[extension]
		if (!contentType) throw new Error('Legacy image type is unsupported')
		return {
			sourcePath,
			key: `devices/${deviceId}${extension}`,
			sha256: await hashFile(sourcePath),
			bytes: sourceStat.size,
			contentType,
		}
	}

	async put(asset: PreparedAsset) {
		try {
			const head = await this.client.send(
				new HeadObjectCommand({ Bucket: this.bucket, Key: asset.key }),
			)
			if (
				head.Metadata?.sha256 === asset.sha256 &&
				head.ContentLength === asset.bytes
			) {
				return { status: 'skipped' as const, etag: head.ETag }
			}
			throw new Error(
				'Existing S3 object does not match the source image checksum',
			)
		} catch (error: any) {
			if (
				error?.$metadata?.httpStatusCode !== 404 &&
				error?.name !== 'NotFound'
			) {
				throw error
			}
		}
		if (this.dryRun) return { status: 'planned' as const, etag: undefined }
		const result = await this.client.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: asset.key,
				Body: createReadStream(asset.sourcePath),
				ContentLength: asset.bytes,
				ContentType: asset.contentType,
				Metadata: { sha256: asset.sha256 },
			}),
		)
		return { status: 'uploaded' as const, etag: result.ETag }
	}

	async verify(asset: PreparedAsset) {
		const head = await this.client.send(
			new HeadObjectCommand({ Bucket: this.bucket, Key: asset.key }),
		)
		return (
			head.Metadata?.sha256 === asset.sha256 &&
			head.ContentLength === asset.bytes
		)
	}
}
