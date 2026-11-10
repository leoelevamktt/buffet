import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import nodemailer from 'nodemailer'
import { isEmail } from './_audit.js'

export const emailLoginConfigured = () => Boolean(
  process.env.ADMIN_EMAIL_SMTP_USER?.trim() && process.env.ADMIN_EMAIL_SMTP_KEY?.trim() && isEmail(process.env.ADMIN_EMAIL_FROM?.trim())
)
export const newEmailCode = () => String(randomInt(1_000_000)).padStart(6, '0')

export const emailCodeHash = (challenge, email, code) => createHmac('sha256', process.env.ADMIN_SESSION_SECRET)
  .update(JSON.stringify(['akela-login-email:v1', challenge, email, code])).digest('hex')

export function verifyEmailCode(challenge, email, code) {
  if (!challenge.email_code_hash || typeof code !== 'string' || !/^[0-9]{6}$/.test(code)) return false
  return timingSafeEqual(Buffer.from(challenge.email_code_hash, 'hex'), Buffer.from(emailCodeHash(challenge.token_hash, email, code), 'hex'))
}

export async function sendLoginCode(email, code) {
  const transport = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 465,
    secure: true,
    auth: { user: process.env.ADMIN_EMAIL_SMTP_USER.trim(), pass: process.env.ADMIN_EMAIL_SMTP_KEY.trim() },
    connectionTimeout: 7000,
    greetingTimeout: 7000,
    socketTimeout: 7000
  })
  const delivery = await transport.sendMail({
    from: { name: 'Buffet Akela', address: process.env.ADMIN_EMAIL_FROM.trim() },
    to: [{ address: email }],
    subject: 'Código de acesso ao Buffet Akela',
    text: 'Seu código de acesso é ' + code + '. Ele vale por 5 minutos e só pode ser usado uma vez. Se você não solicitou o acesso, ignore este e-mail.'
  }).catch(error => {
    const status = Number.isInteger(error.responseCode) ? ' (' + error.responseCode + ')' : ''
    throw new Error('Brevo SMTP recusou a entrega' + status + '.')
  })
  if (!delivery.accepted.length) throw new Error('Brevo SMTP recusou o destinatário.')
}
