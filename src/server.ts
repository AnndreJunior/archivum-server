import { buildApp } from './app'
import { env } from './config/env'
import { logger } from './utils/logger'

buildApp().listen(env.PORT, () => logger.info('Server running'))
