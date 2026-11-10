import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'

export const emailLoginConfigured = () => Boolean(process.env.ADMIN_EMAIL_API_KEY && process.env.ADMIN_EMAIL_FROM)
export const newEmailCode = () => String(randomInt(1_000_000)).padStart(6, '0')

export const emailCodeHash = (challenge, email, code) => createHmac('sha256', process.env.ADMIN_SESSION_SECRET)
  .update(JSON.stringify(['akela-login-email:v1', challenge, email, code])).digest('hex')

export function verifyEmailCode(challenge, email, code) {
  if (!challenge.email_code_hash || typeof code !== 'string' || !/^[0-9]{6}$/.test(code)) return false
  return timingSafeEqual(Buffer.from(challenge.email_code_hash, 'hex'), Buffer.from(emailCodeHash(challenge.token_hash, email, code), 'hex'))
}

export async function sendLoginCode(email, code) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.ADMIN_EMAIL_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.ADMIN_EMAIL_FROM,
      to: [email],
      subject: 'Código de acesso ao Buffet Akela',
      text: 'Seu código de acesso é ' + code + '. Ele vale por 5 minutos e só pode ser usado uma vez. Se você não solicitou o acesso, ignore este e-mail.'
    }),
    signal: AbortSignal.timeout(7000)
  })
  if (!response.ok) throw new Error('Email provider returned ' + response.status)
}
