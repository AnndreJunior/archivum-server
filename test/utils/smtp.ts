import { setTimeout as delay } from 'node:timers/promises'
import { testEnv } from './env'

const DEFAULT_MAILBOX = 'Default'
const DEFAULT_PAGE_SIZE = 50
const DEFAULT_WAIT_TIMEOUT = 5_000
const DEFAULT_WAIT_INTERVAL = 100

/** Resumo de uma mensagem recebida pelo smtp4dev */
export type MessageSummary = {
  id: string
  from: string
  to: string[]
  subject: string
  receivedDate: string
  attachmentCount: number
  isUnread: boolean
  isRelayed: boolean
  hasWarnings: boolean
}

type PagedResult<T> = {
  results: T[]
  rowCount: number
  pageSize: number
  pageCount: number
  currentPage: number
}

export type WaitForMessageOptions = {
  timeout?: number
  interval?: number
}

/** Mensagens da caixa de entrada do smtp4dev, mais recentes primeiro */
export async function getMessages(
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<MessageSummary[]> {
  const query = new URLSearchParams({
    mailboxName: DEFAULT_MAILBOX,
    pageSize: String(pageSize),
  })

  const { results } = await request<PagedResult<MessageSummary>>(
    `/api/Messages?${query}`,
  )

  return results
}

/** Apaga todas as mensagens recebidas */
export async function clearMessages(): Promise<void> {
  await request(`/api/Messages/*?mailboxName=${DEFAULT_MAILBOX}`, {
    method: 'DELETE',
  })
}

/** Apaga o histórico de sessões SMTP */
export async function clearSessions(): Promise<void> {
  await request('/api/Sessions/*', { method: 'DELETE' })
}

/** Conteúdo bruto (RFC 822) da mensagem */
export async function getMessageSource(id: string): Promise<string> {
  return request<string>(`/api/Messages/${id}/source`)
}

/**
 * Aguarda uma mensagem que satisfaça o predicado, porque o envio do e-mail é
 * assíncrono
 */
export async function waitForMessage(
  predicate: (message: MessageSummary) => boolean = () => true,
  {
    timeout = DEFAULT_WAIT_TIMEOUT,
    interval = DEFAULT_WAIT_INTERVAL,
  }: WaitForMessageOptions = {},
): Promise<MessageSummary> {
  const deadline = Date.now() + timeout

  while (Date.now() < deadline) {
    const message = (await getMessages()).find(predicate)

    if (message) {
      return message
    }

    await delay(interval)
  }

  throw new Error(`Nenhuma mensagem esperada foi recebida em ${timeout}ms`)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${testEnv.smtp.apiUrl}${path}`, init)

  if (!response.ok) {
    throw new Error(`A API do smtp4dev respondeu ${response.status} em '${path}'`)
  }

  const body = await response.text()

  if (!body) {
    return undefined as T
  }

  try {
    return JSON.parse(body) as T
  } catch {
    return body as T
  }
}
