// Roda no build: lê o banco (somente SELECT) e grava public/index.html estático.
import mysql from 'mysql2/promise'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { descricao } from './texto.js'
import { diasDaSemana } from './semana.js'

const SQL = `
  SELECT d.codigo, d.titulo, d.figma_url AS figma, d.descricao, d.descricao_texto_plain AS plain, d.descricao_rich_json AS rich, s.nome AS status, s.ordem_exibicao AS ordem, p.nome AS projeto, q.id AS quadroId, q.nome AS quadro,
         dev.nome AS dev, qa.nome AS qa, an.nome AS analista
  FROM demandas d
  JOIN status_fluxo s ON s.id = d.status_fluxo_id
  JOIN projetos p ON p.id = d.projeto_id
  JOIN quadros q ON q.id = d.quadro_id
  LEFT JOIN usuarios dev ON dev.id = d.responsavel_usuario_id
  LEFT JOIN usuarios qa  ON qa.id  = d.qa_usuario_id
  LEFT JOIN usuarios an  ON an.id  = d.analista_usuario_id
  WHERE d.deleted_at IS NULL AND d.arquivado_em IS NULL AND s.eh_terminal = 0
  ORDER BY d.posicao_prioridade, d.id DESC`

const db = await mysql.createConnection(process.env.DATABASE_URL)
const [rows] = await db.query(SQL)
const dias = diasDaSemana()
const intervalo = [dias[0], dias[4]]
const [[homeOffice], [reunioes], [especiais], [trocas]] = await Promise.all([
  db.query(`SELECT DATE_FORMAT(h.data, '%Y-%m-%d') AS data, u.nome, st.nome AS setor
    FROM equipe_escala_home_office h
    JOIN usuarios u ON u.id = h.usuario_id
    LEFT JOIN setores_ti st ON st.id = h.setor_ti_id
    WHERE h.deleted_at IS NULL AND h.data BETWEEN ? AND ? ORDER BY st.nome, u.nome`, intervalo),
  db.query(`SELECT DATE_FORMAT(data, '%Y-%m-%d') AS data, titulo FROM equipe_escala_reunioes_gerais
    WHERE deleted_at IS NULL AND data BETWEEN ? AND ?`, intervalo),
  db.query(`SELECT DATE_FORMAT(d.data, '%Y-%m-%d') AS data, d.tipo, d.motivo, u.nome
    FROM equipe_escala_dias_especiais d LEFT JOIN usuarios u ON u.id = d.usuario_id
    WHERE d.deleted_at IS NULL AND d.data BETWEEN ? AND ?`, intervalo),
  db.query(`SELECT DATE_FORMAT(data_feriado, '%Y-%m-%d') AS feriado, DATE_FORMAT(data_compensacao, '%Y-%m-%d') AS compensacao, nome_feriado AS nome
    FROM equipe_escala_feriado_trocas
    WHERE deleted_at IS NULL AND (data_feriado BETWEEN ? AND ? OR data_compensacao BETWEEN ? AND ?)`, [...intervalo, ...intervalo]),
])
await db.end()
const escala = { dias, homeOffice, reunioes, especiais, trocas }
rows.forEach((r) => { r.descricao = descricao(r); delete r.plain; delete r.rich })

const dados = JSON.stringify(rows).replace(/</g, '\\u003c')
const geradoEm = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
const html = (await readFile('template.html', 'utf8')).replace('__DADOS__', () => dados).replace('__ESCALA__', () => JSON.stringify(escala).replace(/</g, '\\u003c')).replace('__GERADO__', geradoEm)
await mkdir('public', { recursive: true })
await writeFile('public/index.html', html)
console.log(`${rows.length} demandas -> public/index.html`)
