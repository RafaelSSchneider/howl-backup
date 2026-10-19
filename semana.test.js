import { test } from 'node:test'
import assert from 'node:assert/strict'
import { diasDaSemana } from './semana.js'

const seg = ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23']
const prox = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30']

test('dias úteis da semana atual, de segunda a sexta', () => {
  assert.deepEqual(diasDaSemana(new Date('2026-10-19T15:00:00Z')), seg) // segunda
  assert.deepEqual(diasDaSemana(new Date('2026-10-23T15:00:00Z')), seg) // sexta
})

test('fim de semana mostra a semana seguinte', () => {
  assert.deepEqual(diasDaSemana(new Date('2026-10-24T15:00:00Z')), prox) // sábado
  assert.deepEqual(diasDaSemana(new Date('2026-10-25T15:00:00Z')), prox) // domingo
})

test('usa o fuso de São Paulo, não UTC', () => {
  // 02:00 UTC de sábado ainda é sexta 23:00 em São Paulo
  assert.deepEqual(diasDaSemana(new Date('2026-10-24T02:00:00Z')), seg)
})
