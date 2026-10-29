import assert from 'node:assert/strict'
import { decryptWorkspace, encryptWorkspace } from '../api/_workspace-crypto.js'

export async function encryptExistingWorkspace(client,saveBackup) {
  const current=await client.query("SELECT data,revision FROM buffet_workspace WHERE id='main' FOR UPDATE")
  if (!current.rowCount) throw new Error('Área de trabalho não encontrada.')
  const row=current.rows[0],data=decryptWorkspace(row.data)
  if (Object.hasOwn(row.data,'encrypted')) {
    await saveBackup({data:row.data,revision:row.revision})
    return {alreadyEncrypted:true}
  }
  const encrypted=encryptWorkspace(data)
  assert.deepEqual(decryptWorkspace(encrypted),data)
  await saveBackup({data:encrypted,revision:(BigInt(row.revision)+1n).toString()})
  const updated=await client.query(`UPDATE buffet_workspace SET data=$1::jsonb,revision=revision+1,updated_at=now()
    WHERE id='main' AND revision=$2 RETURNING data,revision`,[JSON.stringify(encrypted),row.revision])
  if (!updated.rowCount) throw new Error('Revisão da área de trabalho alterada.')
  assert.deepEqual(decryptWorkspace(updated.rows[0].data),data)
  return {alreadyEncrypted:false,revision:Number(updated.rows[0].revision)}
}
