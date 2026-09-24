import { describe, expect, it } from 'vitest'
import { api } from '@test/utils'

describe('GET /healthz', () => {
  it('responde 200 com o texto Healthy', async () => {
    const response = await api().get('/healthz')

    expect(response.status).toBe(200)
    expect(response.text).toBe('Healthy')
  })
})
