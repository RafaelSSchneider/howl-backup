// Roda no build: lê o banco (somente SELECT) e grava public/index.html estático.
import mysql from 'mysql2/promise'
import { readFile, writeFile } from 'node:fs/promises'

const SQL = `
  SELECT d.codigo, d.titulo, d.figma_url AS figma, s.nome AS status,
         dev.nome AS dev, qa.nome AS qa, an.nome AS analista
  FROM demandas d
  JOIN status_fluxo s ON s.id = d.status_fluxo_id
  LEFT JOIN usuarios dev ON dev.id = d.responsavel_usuario_id
  LEFT JOIN usuarios qa  ON qa.id  = d.qa_usuario_id
  LEFT JOIN usuarios an  ON an.id  = d.analista_usuario_id
  WHERE d.deleted_at IS NULL AND d.arquivado_em IS NULL AND s.eh_terminal = 0
  ORDER BY d.posicao_prioridade, d.id DESC`

const db = await mysql.createConnection(process.env.DATABASE_URL)
const [rows] = await db.query(SQL)
await db.end()

const dados = JSON.stringify(rows).replace(/</g, '\\u003c')
const geradoEm = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
const html = (await readFile('template.html', 'utf8')).replace('__DADOS__', () => dados).replace('__GERADO__', geradoEm)
await writeFile('public/index.html', html)
console.log(`${rows.length} demandas -> public/index.html`)
