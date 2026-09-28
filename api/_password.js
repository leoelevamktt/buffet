import { randomBytes, scrypt as scryptRaw, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
const scrypt = promisify(scryptRaw)
const config = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }
export const validPassword = (value) =>
  typeof value === 'string' && value.length >= 12 && value.length <= 128
export const passwordHash = async (value) => {
  if (!validPassword(value)) throw new Error('A senha deve conter entre 12 e 128 caracteres.')
  const salt = randomBytes(24)
  const key = await scrypt(value, salt, 64, config)
  return ['scrypt', '16384', '8', '1', salt.toString('hex'), key.toString('hex')].join('$')
}
export const passwordVerify = async (candidate, encoded) => {
  if (typeof candidate !== 'string' || candidate.length > 256 || !/^scrypt\$16384\$8\$1\$[a-f0-9]{48}\$[a-f0-9]{128}$/.test(String(encoded))) return false
  const [, , , , salt, target] = encoded.split('$')
  const computed = await scrypt(candidate, Buffer.from(salt, 'hex'), 64, config)
  return timingSafeEqual(computed, Buffer.from(target, 'hex'))
}
