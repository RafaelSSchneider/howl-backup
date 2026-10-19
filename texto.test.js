import { test } from 'node:test'
import assert from 'node:assert/strict'
import { descricao, paraTexto, richParaTexto } from './texto.js'

const doc = (...content) => JSON.stringify({ type: 'doc', content })
const p = (...content) => ({ type: 'paragraph', content })
const txt = (text, bold) => ({ type: 'text', text, ...(bold && { marks: [{ type: 'bold' }] }) })

test('rich: título, negrito, listas e imagem ignorada', () => {
  const json = doc(
    { type: 'heading', attrs: { level: 3 }, content: [txt('RF-03: Busca', true)] },
    p(txt('Descrição: ', true), txt('texto')),
    { type: 'paragraph', content: [{ type: 'image', attrs: { src: 'x' } }] },
    { type: 'bulletList', content: [{ type: 'listItem', content: [p(txt('um'))] }, { type: 'listItem', content: [p(txt('dois'))] }] },
    { type: 'orderedList', content: [{ type: 'listItem', content: [p(txt('a'))] }] },
  )
  assert.equal(richParaTexto(json), '## RF-03: Busca\n\n**Descrição:** texto\n\n• um\n• dois\n\n1. a')
})

test('rich inválido cai para o HTML e depois para o plano', () => {
  assert.equal(descricao({ rich: '{quebrado', descricao: '<p>a</p><p>b</p>', plain: 'x' }), 'a\n\nb')
  assert.equal(descricao({ rich: null, descricao: null, plain: 'só plano' }), 'só plano')
})

test('linhas com só espaço não geram buracos', () => {
  assert.equal(paraTexto('a\n \n \n\n\nb'), 'a\n\nb')
})
