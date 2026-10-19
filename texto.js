// Converte as descrições do banco em texto com quebras de linha e Markdown básico (## e **),
// que o template renderiza no modal.

const normalizar = (s) => s
  .replace(/\r\n?/g, '\n')
  .split('\n').map((l) => l.replace(/[\s ]+$/, '')).join('\n') // linhas só com espaço viram vazias
  .replace(/\n{3,}/g, '\n\n') // no máximo uma linha em branco entre parágrafos
  .trim()

// Descrição antiga: HTML ou texto puro.
export const paraTexto = (s) => normalizar((s ?? '')
  .replace(/\r\n?/g, '\n')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(p|div|h[1-6]|ul|ol|blockquote)>/gi, '\n\n')
  .replace(/<\/li>/gi, '\n')
  .replace(/<li[^>]*>/gi, '• ')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;|&#160;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&')
  .replace(/^- /gm, '• '))

// Texto de um nó inline; negrito vira **x** com os espaços por fora.
const inline = (nos = []) => nos.map((n) => {
  if (n.type === 'hardBreak') return '\n'
  if (n.type !== 'text') return inline(n.content)
  const t = n.text ?? ''
  if (!n.marks?.some((m) => m.type === 'bold') || !t.trim()) return t
  const [, a, meio, b] = t.match(/^(\s*)(.*?)(\s*)$/s)
  return `${a}**${meio}**${b}`
}).join('')

// Descrição do editor rico (JSON TipTap/ProseMirror). Imagens são ignoradas.
const bloco = (n, prefixo = '') => {
  const filhos = n.content ?? []
  switch (n.type) {
    case 'heading': return '## ' + inline(filhos).replace(/\*\*/g, '')
    case 'paragraph': return prefixo + inline(filhos)
    case 'bulletList': return filhos.map((li) => item(li, '• ')).join('\n')
    case 'orderedList': return filhos.map((li, i) => item(li, `${(n.attrs?.start ?? 1) + i}. `)).join('\n')
    case 'taskList': return filhos.map((li) => item(li, li.attrs?.checked ? '☑ ' : '☐ ')).join('\n')
    case 'codeBlock': return inline(filhos)
    case 'table': return filhos.map((tr) => (tr.content ?? []).map((c) => (c.content ?? []).map((x) => bloco(x)).join(' ')).join(' | ')).join('\n')
    case 'image': case 'horizontalRule': return ''
    default: return filhos.map((x) => bloco(x)).filter(Boolean).join('\n\n')
  }
}
// Item de lista: primeiro bloco com o marcador, sub-blocos recuados.
const item = (li, marcador) => (li.content ?? []).map((x, i) => (i ? '   ' : marcador) + bloco(x).replace(/\n/g, '\n   ')).join('\n')

export const richParaTexto = (json) => {
  try { return normalizar(bloco(JSON.parse(json))) } catch { return '' }
}

// Prioridade: editor rico (tem a formatação) → HTML/texto antigo → texto plano.
export const descricao = (r) => richParaTexto(r.rich) || paraTexto(r.descricao) || paraTexto(r.plain)
