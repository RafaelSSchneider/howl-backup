// Roda no build: lê o banco (somente SELECT) e grava public/index.html estático.
import mysql from 'mysql2/promise'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const SQL = `
  SELECT d.codigo, d.titulo, d.figma_url AS figma, COALESCE(NULLIF(d.descricao_texto_plain, ""), d.descricao) AS descricao, s.nome AS status, s.ordem_exibicao AS ordem, p.nome AS projeto,
         dev.nome AS dev, qa.nome AS qa, an.nome AS analista
  FROM demandas d
  JOIN status_fluxo s ON s.id = d.status_fluxo_id
  JOIN projetos p ON p.id = d.projeto_id
  LEFT JOIN usuarios dev ON dev.id = d.responsavel_usuario_id
  LEFT JOIN usuarios qa  ON qa.id  = d.qa_usuario_id
  LEFT JOIN usuarios an  ON an.id  = d.analista_usuario_id
  WHERE d.deleted_at IS NULL AND d.arquivado_em IS NULL AND s.eh_terminal = 0
  ORDER BY d.posicao_prioridade, d.id DESC`

// Descrição pode vir como HTML; vira texto puro preservando as quebras de linha.
const paraTexto = (s) => (s ?? '')
  .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6])>/gi, '\n')
  .replace(/<li[^>]*>/gi, '- ')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim()

const db = await mysql.createConnection(process.env.DATABASE_URL)
const [rows] = await db.query(SQL)
await db.end()
rows.forEach((r) => { r.descricao = paraTexto(r.descricao) })

const dados = JSON.stringify(rows).replace(/</g, '\\u003c')
const geradoEm = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
const html = (await readFile('template.html', 'utf8')).replace('__DADOS__', () => dados).replace('__GERADO__', geradoEm)
await mkdir('public', { recursive: true })
await writeFile('public/index.html', html)
console.log(`${rows.length} demandas -> public/index.html`)
