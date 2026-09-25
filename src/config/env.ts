import 'dotenv/config'
import z from 'zod'

const envSchema = z
  .object({
    PORT: z.coerce.number(),
    NODE_ENV: z.enum(['development', 'production', 'test']),
    ALLOWED_ORIGINS: z
      .string()
      .optional()
      .transform((data) => {
        if (data) {
          return data.split(';')
        }
        return undefined
      }),
    DATABASE_URL: z.url(),
    LIBRARIAN_REGISTRATION: z.string().min(1),
    LIBRARIAN_EMAIL: z.email(),
    LIBRARIAN_PASSWORD: z.string().min(1),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number(),
    SMTP_FROM: z.email(),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASS: z.string().min(1).optional(),
  })
  .refine(
    (data) => {
      if (data.NODE_ENV === 'production' && !data.ALLOWED_ORIGINS) return false
      return true
    },
    {
      error: 'ALLOWED_ORIGINS is required in production',
      path: ['ALLOWED_ORIGINS'],
    },
  )
  .refine((data) => (data.SMTP_USER ? Boolean(data.SMTP_PASS) : true), {
    error: 'SMTP_PASS is required when SMTP_USER is set',
    path: ['SMTP_PASS'],
  })

export const env = envSchema.parse(process.env)
