import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import ts from 'typescript'
import { safeOrigin } from '../api/_session.js'
import contracts from '../api/contracts.js'
import quotes from '../api/quotes.js'
import addenda from '../api/addenda.js'

test('cross-site writes without an Origin header are rejected', () => {
  assert.equal(safeOrigin({method:'POST',headers:{host:'akelabuffet.vercel.app','sec-fetch-site':'cross-site'}}),false)
  assert.equal(safeOrigin({method:'POST',headers:{host:'akelabuffet.vercel.app',origin:'https://akelabuffet.vercel.app'}}),true)
  assert.equal(safeOrigin({method:'POST',headers:{host:'akelabuffet.vercel.app',origin:'https://attacker.invalid'}}),false)
})

test('public document routes reject path characters before reading private storage', async () => {
  for (const handler of [contracts, quotes, addenda]) {
    const res={code:200,setHeader(){},status(n){this.code=n;return this},json(){return this}}
    await handler({method:'GET',query:{token:'../'.repeat(12)+'private'},headers:{}},res)
    assert.equal(res.code,400)
  }
})

test('contract HTML removes nested active content and preserves formatting',async()=>{
  const source=(await readFile(new URL('../src/addenda.ts',import.meta.url),'utf8'))
    .split('const escapeHtml')[0].replace(/^import .*$/gm,'')
  const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replaceAll('export ','')
  const html=`<!doctype html><body><script>${js}
    const clean=sanitizeAddendumHtml('<unknown><img src=x onerror="alert(1)"><svg onload="alert(2)"></svg><p onclick="alert(3)" style="text-align:center">Seguro</p></unknown>');
    const parsed=new DOMParser().parseFromString(clean,'text/html');
    const unsafe=parsed.querySelector('img,svg,script,iframe,[onerror],[onload],[onclick]');
    const p=parsed.querySelector('p');
    const longClean=sanitizeAddendumHtml('<p>'+ 'a'.repeat(600010) +'</p><p>Clausula final preservada</p>');
    document.body.textContent=JSON.stringify({safe:!unsafe,text:p?.textContent,align:p?.style.textAlign,longPreserved:longClean.includes('Clausula final preservada')});
  </script>`
  const dir=await mkdtemp(join(tmpdir(),'akela-security-'))
  try {
    const file=join(dir,'test.html');await writeFile(file,html)
    const browser=spawnSync(process.env.CHROME_BIN||'google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--no-first-run','--user-data-dir='+join(dir,'profile'),'--dump-dom','file://'+file],{encoding:'utf8',timeout:30000})
    assert.equal(browser.status,0,'A Chromium browser is required for the HTML security regression test')
    const result=JSON.parse(browser.stdout.match(/<body>(\{[^<]+\})<\/body>/)?.[1]||'{}')
    assert.equal(result.safe,true,'Nested elements retained executable content')
    assert.equal(result.text,'Seguro')
    assert.equal(result.align,'center')
    assert.equal(result.longPreserved,true,'A signed contract must retain its final clauses')
  } finally {await rm(dir,{recursive:true,force:true})}
})
