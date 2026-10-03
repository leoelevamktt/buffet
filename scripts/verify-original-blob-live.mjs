import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createHash } from 'node:crypto'
import { get, list } from '@vercel/blob'

const base = path.join(os.homedir(), 'Documents', 'BuffetAkela', 'original-blob-backup-2026-10-03')
const manifest = JSON.parse(fs.readFileSync(path.join(base, 'original-blob-manifest.json'), 'utf8'))
const env = fs.readFileSync('.env.local', 'utf8')
const token = env.match(/^BLOB_READ_WRITE_TOKEN=(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '')
if (!token || token.length < 35) throw Error('New Blob credential not available locally')
const digest = data => createHash('sha256').update(data).digest('hex')
if (manifest.files.length !== 29) throw Error('Original 29-file manifest not found')
const keys = new Set()
let compared = 0, bytes = 0
for (const item of manifest.files) {
  if (!/^[a-zA-Z0-9/_-]+\.json$/.test(item.pathname) || item.pathname.includes('..') || keys.has(item.pathname))
    throw Error('Unsafe or repeated Blob pathname')
  keys.add(item.pathname)
  const local = fs.readFileSync(path.join(base, ...item.pathname.split('/')))
  if (local.length !== item.bytes || digest(local) !== item.sha256) throw Error('Original backup checksum mismatch')
  const live = await get(item.pathname, { access: 'private', token, useCache: false })
  if (!live || live.statusCode !== 200) throw Error('New Blob missing object: ' + item.pathname)
  const remote = Buffer.from(await new Response(live.stream).arrayBuffer())
  if (digest(remote) !== item.sha256 || remote.length !== item.bytes)
    throw Error('New Blob differs from original: ' + item.pathname)
  compared++
  bytes += remote.length
}
let cursor, recovered = 0, total = 0
do {
  const page = await list({ token, limit: 1000, ...(cursor ? {cursor} : {}) })
  for (const item of page.blobs) {
    total++
    if (item.pathname.startsWith('migration-recovered/')) recovered++
  }
  cursor = page.hasMore ? page.cursor : undefined
} while (cursor)
if (recovered < 8 || total < 37) throw Error('Recovered objects or total object count incomplete')
console.log('ORIGINAL_PRIVATE_BLOB_SHA256_PASS', JSON.stringify({
  originalsVerified:compared,originalBytes:bytes,recoveredCopies:recovered,totalObjects:total
}))
