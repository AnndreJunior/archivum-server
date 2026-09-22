import { buildApp } from './app'
import { env } from './config/env'

buildApp().listen(env.PORT, () => console.log('Server running'))
