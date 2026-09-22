import { pino, stdTimeFunctions } from 'pino'
import { env } from '@src/config/env'

const isDev = env.NODE_ENV === 'development'

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  timestamp: stdTimeFunctions.isoTime,
  transport: isDev ? { target: 'pino-pretty' } : undefined,
  mixin: () => ({
    environment: env.NODE_ENV,
  }),
})
