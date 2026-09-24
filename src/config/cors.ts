import { CorsOptions } from 'cors'
import { env } from '@src/config/env'

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (env.NODE_ENV === 'development') {
      callback(null, true)
      return
    }

    if (!origin || env.ALLOWED_ORIGINS?.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('Not allowed'), false)
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
