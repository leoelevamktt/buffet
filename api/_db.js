import pg from 'pg'
let pool
export function database() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não configurada.')
  if (!pool) {
    const uri = new URL(process.env.DATABASE_URL)
    uri.searchParams.set('sslmode', 'verify-full')
    pool = new pg.Pool({
      connectionString: uri.toString(),
      max: 2,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: true }
    })
    pool.on('error', (error) => console.error('neon_idle_connection_error', error.message))
  }
  return pool
}
