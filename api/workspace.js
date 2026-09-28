import { database } from './_db.js'
import { requireAdmin } from './_session.js'

const keys = ['events', 'menus', 'services', 'settings', 'receipts']
const validate = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  return keys.every((k) => k in data) &&
    Array.isArray(data.events) && Array.isArray(data.menus) &&
    Array.isArray(data.services) && Array.isArray(data.receipts) &&
    data.settings !== null && typeof data.settings === 'object' && !Array.isArray(data.settings) &&
    data.events.length <= 10000 && data.menus.length <= 1000 &&
    data.services.length <= 1000 && data.receipts.length <= 25000
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!requireAdmin(req, res)) return
  if (!['GET', 'POST', 'PUT'].includes(req.method)) return res.status(405).json({ error: 'Método não permitido.' })
  try {
    const sql = database()
    if (req.method === 'GET') {
      const result = await sql.query("SELECT data, revision, updated_at FROM buffet_workspace WHERE id='main'")
      if (!result.rowCount) return res.status(200).json({ initialized: false, revision: 0 })
      const state = result.rows[0]
      return res.status(200).json({
        initialized: true, data: state.data, revision: Number(state.revision), updatedAt: state.updated_at
      })
    }
    const serialized = JSON.stringify(req.body?.data || '')
    if (serialized.length > 5_000_000 || !validate(req.body?.data))
      return res.status(400).json({ error: 'Dados incompletos ou excedem os limites permitidos.' })
    const revision = req.body?.revision
    if (!Number.isSafeInteger(revision) || revision < 0)
      return res.status(400).json({ error: 'Revisão inválida.' })
    if (req.method === 'POST') {
      if (revision !== 0) return res.status(400).json({ error: 'Inicialização exige revisão zero.' })
      const response = await sql.query(`INSERT INTO buffet_workspace(id,data,revision)
        VALUES('main',$1::jsonb,1) ON CONFLICT(id) DO NOTHING RETURNING revision,updated_at`, [serialized])
      if (!response.rowCount) return res.status(409).json({ error: 'O banco já foi inicializado. Recarregue para acessar os dados existentes.' })
      return res.status(201).json({ initialized: true, revision: 1, updatedAt: response.rows[0].updated_at })
    }
    if (revision === 0) return res.status(409).json({ error: 'Inicialize o banco antes de atualizar.' })
    const changed = await sql.query(`UPDATE buffet_workspace SET data=$1::jsonb, revision=revision+1,
      updated_at=now() WHERE id='main' AND revision=$2 RETURNING revision,updated_at`, [serialized,revision])
    if (!changed.rowCount)
      return res.status(409).json({ error: 'Outra sessão atualizou o banco. Recarregue os dados antes de salvar.' })
    return res.status(200).json({ revision: Number(changed.rows[0].revision), updatedAt: changed.rows[0].updated_at })
  } catch (error) {
    console.error('workspace_operation_error', error.message)
    return res.status(500).json({ error: 'Não foi possível acessar o Neon. Os dados não foram confirmados como salvos.' })
  }
}
