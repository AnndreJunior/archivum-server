import z from 'zod'

export const loginSchema = z.object({
  email: z.email({ error: 'E-mail com formato inválido.' }),
  password: z
    .string({ error: 'Informe sua senha.' })
    .nonoptional({ error: 'Informe sua senha.' }),
})

export type LoginRequestDto = z.infer<typeof loginSchema>
