import { database } from './_db.js'
import { requireAdmin } from './_session.js'
import { reserveAttempt, securityEvent } from './_security.js'

const sections=new Set(['dashboard','events','clients','menus','contracts','receipts','agenda','settings','users','profile','logs','protected'])
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store')
  try {
    const user=await requireAdmin(req,res,req.method==='GET'?'admin':undefined,req.method!=='POST')
    if (!user) return
    if (req.method==='GET') {
      const before=req.query?.before
      if (before!==undefined && (typeof before!=='string' || !/^[1-9][0-9]{0,17}$/.test(before))) return res.status(400).json({error:'Página inválida.'})
      const result=await database().query('SELECT * FROM buffet_security_log_view WHERE ($1::bigint IS NULL OR id<$1::bigint) ORDER BY id DESC LIMIT 100',[before||null])
      return res.status(200).json({events:result.rows})
    }
    if (req.method==='POST' && sections.has(req.body?.section)) {
      if (await reserveAttempt(database(),'activity:'+user.id,60)) return res.status(429).json({error:'Limite de registros atingido.'})
      await securityEvent(database(),req,'page_view',user.id,{section:req.body.section})
      return res.status(200).json({recorded:true})
    }
    return res.status(400).json({error:'Operação inválida.'})
  } catch(error) {
    console.error('activity_error',error.message)
    return res.status(500).json({error:'Não foi possível consultar os registros.'})
  }
}
