import { z } from 'zod'

const envSchema = z.object({
  PORT: z.string(),
  DATABASE_URL: z.string().url(),
  CLOUDFLARE_ENDPOINT: z.string().url(),
  CLOUDFLARE_ACCESS_KEY_ID: z.string(),
  CLOUDFLARE_SECRET_ACCESS_KEY: z.string(),
  CLOUDFLARE_AUTH_TOKEN: z.string(),
  CLOUDFLARE_BUCKET_NAME: z.string(),
})

export const env = envSchema.parse(process.env)
