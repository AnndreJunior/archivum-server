// O env de teste precisa ser aplicado antes de qualquer import de '@src'
import './env'
import request from 'supertest'
import { buildApp } from '@src/app'

/** App Express sem 'listen()': o supertest sobe o servidor em uma porta efêmera */
export const app = buildApp()

/** Cliente do supertest para bater nos endpoints da aplicação */
export function api() {
  return request(app)
}
