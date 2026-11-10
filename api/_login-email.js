import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { isEmail } from './_audit.js'

export const emailLoginConfigured = () => Boolean(process.env.ADMIN_EMAIL_API_KEY?.trim() && isEmail(process.env.ADMIN_EMAIL_FROM?.trim()))
export const newEmailCode = () => String(randomInt(1_000_000)).padStart(6, '0')

export const emailCodeHash = (challenge, email, code) => createHmac('sha256', process.env.ADMIN_SESSION_SECRET)
  .update(JSON.stringify(['akela-login-email:v1', challenge, email, code])).digest('hex')

export function verifyEmailCode(challenge, email, code) {
  if (!challenge.email_code_hash || typeof code !== 'string' || !/^[0-9]{6}$/.test(code)) return false
  return timingSafeEqual(Buffer.from(challenge.email_code_hash, 'hex'), Buffer.from(emailCodeHash(challenge.token_hash, email, code), 'hex'))
}

export async function sendLoginCode(email, code) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.ADMIN_EMAIL_API_KEY.trim(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'Buffet Akela', email: process.env.ADMIN_EMAIL_FROM.trim() },
      to: [{ email }],
      subject: 'Código de acesso ao Buffet Akela',
      textContent: 'Seu código de acesso é ' + code + '. Ele vale por 5 minutos e só pode ser usado uma vez. Se você não solicitou o acesso, ignore este e-mail.'
    }),
    signal: AbortSignal.timeout(7000)
  })
  if (!response.ok) throw new Error('Brevo returned HTTP ' + response.status)
}
