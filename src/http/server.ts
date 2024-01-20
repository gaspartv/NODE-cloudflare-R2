import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'
import fastify from 'fastify'
import { z } from 'zod'
import { env } from '../env'
import { r2 } from '../lib/cloudflare'

const app = fastify()

const prisma = new PrismaClient()

app.post('/uploads', async (request) => {
  const uploadBodySchema = z.object({
    name: z.string().min(1),
    contentType: z.string().regex(/\w+\/[-+.\w]+/),
  })

  const { contentType, name } = uploadBodySchema.parse(request.body)

  const fileKey = randomUUID().concat('-').concat(name)

  const signedUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: env.CLOUDFLARE_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    }),
    { expiresIn: 600 }
  )
  const file = await prisma.file.create({
    data: {
      name,
      contentType,
      key: fileKey,
    },
  })
  return { signedUrl, fileId: file.id }
})

app.get('/uploads/:id', async (request) => {
  const getFileParamsSchema = z.object({
    id: z.string().cuid(),
  })

  const { id } = getFileParamsSchema.parse(request.params)

  const file = await prisma.file.findUniqueOrThrow({
    where: {
      id,
    },
  })

  const signedUrl = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: env.CLOUDFLARE_BUCKET_NAME,
      Key: file.key,
    }),
    { expiresIn: 600 }
  )

  return signedUrl
})

app.listen(
  {
    port: Number(env.PORT),
    host: '0.0.0.0',
  },
  () => console.info(`HTTP server listen on port ${env.PORT}`)
)
