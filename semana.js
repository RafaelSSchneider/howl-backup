// Semana exibida na aba Escala: segunda a sexta da semana atual (fuso de São Paulo).
// Sábado e domingo mostram a semana seguinte, que é a próxima a ser trabalhada.
export const diasDaSemana = (agora = new Date()) => {
  const hoje = new Date(agora.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }) + 'T00:00:00Z')
  const dow = hoje.getUTCDay() // 0 = domingo
  const ateSegunda = dow === 0 ? 1 : dow === 6 ? 2 : 1 - dow
  return Array.from({ length: 5 }, (_, i) => new Date(hoje.getTime() + (ateSegunda + i) * 86400000).toISOString().slice(0, 10))
}
