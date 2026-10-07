import z from 'zod'

export const loginSchema = z.object({
  email: z.email({ error: 'E-mail com formato inválido.' }),
  password: z
    .string({ error: 'Informe sua senha.' })
    .nonoptional({ error: 'Informe sua senha.' }),
})

export const login2faSchema = z.object({
  token: z.string().nonoptional(),
  code: z
    .string({ error: 'Informe o código de confirmação.' })
    .nonoptional({ error: 'Informe o código de confirmação.' }),
})

export type LoginRequestDto = z.infer<typeof loginSchema>
export type Login2faRequestDto = z.infer<typeof login2faSchema>
