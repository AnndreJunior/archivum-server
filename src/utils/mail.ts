import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import handlebars from 'handlebars'
import nodemailer from 'nodemailer'
import { env } from '@src/config/env'
import { logger } from '@src/utils/logger'

/**
 * Pasta dos templates, resolvida a partir deste arquivo: 'src/views/mails' em
 * desenvolvimento e 'dist/views/mails' em produção (o build copia a pasta).
 */
const templatesDir = fileURLToPath(new URL('../views/mails/', import.meta.url))

/** Dados aceitos por sendMail: as 'variables' preenchem os {{campos}} do template */
export type SendMailOptions = {
  to: string
  subject: string
  template: string
  variables?: Record<string, unknown>
}

/**
 * O transporter é criado fora da função para reaproveitar a conexão entre os
 * envios. A autenticação só é configurada quando SMTP_USER e SMTP_PASS existem,
 * o que permite usar servidores locais sem credenciais (smtp4dev, por exemplo).
 */
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
})

/**
 * Renderiza o template '<template>.hbs' com as variáveis recebidas e envia o
 * HTML resultante para 'to'.
 *
 * O erro é propagado com a causa original porque quem chama decide se a falha
 * no envio deve interromper a operação: um empréstimo não pode ser desfeito só
 * porque o e-mail de aviso não saiu.
 */
export async function sendMail({
  to,
  subject,
  template,
  variables = {},
}: SendMailOptions): Promise<void> {
  try {
    const templatePath = resolve(templatesDir, `${template}.hbs`)
    const templateContent = await readFile(templatePath, 'utf8')
    const html = handlebars.compile(templateContent)(variables)

    await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html })

    logger.debug({ to, subject, template }, 'E-mail enviado')
  } catch (error) {
    throw new Error(`Não foi possível enviar o e-mail '${subject}' para '${to}'`, {
      cause: error,
    })
  }
}
