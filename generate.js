// Roda no build: lê o banco (somente SELECT) e grava public/index.html estático.
import mysql from 'mysql2/promise'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { descricao } from './texto.js'

const SQL = `
  SELECT d.codigo, d.titulo, d.figma_url AS figma, d.descricao, d.descricao_texto_plain AS plain, d.descricao_rich_json AS rich, s.nome AS status, s.ordem_exibicao AS ordem, p.nome AS projeto,
         dev.nome AS dev, qa.nome AS qa, an.nome AS analista
  FROM demandas d
  JOIN status_fluxo s ON s.id = d.status_fluxo_id
  JOIN projetos p ON p.id = d.projeto_id
  LEFT JOIN usuarios dev ON dev.id = d.responsavel_usuario_id
  LEFT JOIN usuarios qa  ON qa.id  = d.qa_usuario_id
  LEFT JOIN usuarios an  ON an.id  = d.analista_usuario_id
  WHERE d.deleted_at IS NULL AND d.arquivado_em IS NULL AND s.eh_terminal = 0
  ORDER BY d.posicao_prioridade, d.id DESC`

const db = await mysql.createConnection(process.env.DATABASE_URL)
const [rows] = await db.query(SQL)
await db.end()
rows.forEach((r) => { r.descricao = descricao(r); delete r.plain; delete r.rich })

const dados = JSON.stringify(rows).replace(/</g, '\\u003c')
const geradoEm = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
const html = (await readFile('template.html', 'utf8')).replace('__DADOS__', () => dados).replace('__GERADO__', geradoEm)
await mkdir('public', { recursive: true })
await writeFile('public/index.html', html)
console.log(`${rows.length} demandas -> public/index.html`)
