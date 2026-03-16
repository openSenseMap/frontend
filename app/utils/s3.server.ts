import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const S3_ENDPOINT = (process.env.S3_ENDPOINT || 'http://localhost:9000').replace(/\/$/, '')
const S3_REGION = process.env.S3_REGION || 'eu-north-1'
const BUCKET_NAME = process.env.S3_BUCKET || 'devices'

const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
})

async function ensureBucketExists() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }))
  } catch (error: any) {
    const code = error?.name || error?.Code
    if (
      code === 'NotFound' ||
      code === 'NoSuchBucket' ||
      error?.$metadata?.httpStatusCode === 404
    ) {
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }))
      return
    }
    throw error
  }
}

export async function uploadDeviceImage(
  deviceId: string,
  file: File,
): Promise<string> {
  await ensureBucketExists()

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

  return key
}

export async function getDeviceImageUrl(key: string): Promise<string> {
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }),
    {
      expiresIn: 60 * 60, // 1 hour
    },
  )
}

export async function deleteDeviceImage(key: string): Promise<void> {
  if (!key) return

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }),
  )
}