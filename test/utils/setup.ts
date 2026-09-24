// O env de teste precisa ser aplicado antes de qualquer import de '@src'
import './env'
import { afterAll, beforeEach } from 'vitest'
import { closeDatabase, truncateDatabase } from './database'
import { clearMessages, clearSessions } from './smtp'

// Cada teste começa com o banco e o servidor de e-mail limpos
beforeEach(async () => {
  await truncateDatabase()
  await clearMessages()
  await clearSessions()
})

afterAll(async () => {
  await closeDatabase()
})
