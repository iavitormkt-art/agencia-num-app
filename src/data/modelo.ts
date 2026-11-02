// Tipos e textos fixos do app (Fase 1: humano como API).
// Nenhum tipo aqui guarda senha, código de verificação ou token das redes do cliente.

export type StatusDiagnostico = 'recebido' | 'analise' | 'pronto'
export type StatusConexao = 'pendente' | 'solicitado' | 'pedido' | 'aguardando' | 'conectado'
export type Plano = 'automacao' | 'gestao'

export type Ponto = {
  id: string
  nota: number | null
  comentario: string
  prints: string[]
}

export type Diagnostico = {
  id: string
  negocioId: string
  status: StatusDiagnostico
  pedidoEm: string
  publicadoEm?: string
  pontos: Ponto[]
  resumo: string
  plano: Plano
  observacoes: string
}

export type Reavaliacao = {
  data: string
  notas: Record<string, number>
}

export type Notificacao = {
  id: string
  negocioId: string
  data: string
  titulo: string
  texto: string
  lida: boolean
}

export type DadosNegocio = {
  horario: string
  endereco: string
  cardapio: string
  perguntas: string
  whatsapps: string
}

export type Negocio = {
  id: string
  nome: string
  responsavel: string
  email: string
  tipo: string
  cidade: string
  instagram: string
  facebook: string
  site: string
  whatsapp: string
  incomodos: string[]
  checklist: Record<string, boolean>
  conexao: StatusConexao
  inicioJornada?: string
  vitorias: string[]
  materiais: string[]
  dados: DadosNegocio
  reavaliacoes: Reavaliacao[]
}

export const PONTOS = [
  {
    id: 'mensagens',
    titulo: 'Resposta nas mensagens',
    dica: 'Quem pergunta o preço já está com fome. Responder rápido aumenta a chance de venda.',
  },
  {
    id: 'comentarios',
    titulo: 'Comentários sem resposta',
    dica: 'Comentário sem resposta é um cliente falando sozinho na frente de todo mundo.',
  },
  {
    id: 'bio',
    titulo: 'Site e link da bio',
    dica: 'O link da bio é a porta da loja: precisa levar direto ao cardápio e ao WhatsApp.',
  },
  {
    id: 'frequencia',
    titulo: 'Frequência de posts',
    dica: 'Quem posta com regularidade é lembrado na hora da fome.',
  },
  {
    id: 'identidade',
    titulo: 'Identidade visual',
    dica: 'Mesmas cores e fontes em todas as peças fazem a marca ser reconhecida de longe.',
  },
  {
    id: 'destaques',
    titulo: 'Destaques e Facebook',
    dica: 'Os destaques são o cardápio fixo do perfil: o cliente procura ali antes de perguntar.',
  },
] as const

export const CHECKLIST = [
  {
    id: '2fa',
    texto: 'Autenticação de dois fatores ativada no Instagram e no Facebook',
    dica: 'Em Central de Contas > Senha e segurança > Autenticação de dois fatores. Mesmo com a senha, ninguém entra sem o seu celular.',
  },
  {
    id: 'contato',
    texto: 'E-mail e telefone da conta atualizados e só seus',
    dica: 'É por eles que você recupera a conta. Se forem de um ex-funcionário, a conta é dele na prática.',
  },
  {
    id: 'controle',
    texto: 'Ninguém além de você (ou do sócio) com controle total',
    dica: 'Controle total permite tirar você da própria página. No Business Suite, em Configurações > Pessoas, deixe só você.',
  },
  {
    id: 'revisao',
    texto: 'Acessos revisados: quem não trabalha mais com você foi removido',
    dica: 'Agência antiga, sobrinho, ex-funcionário: se não trabalha mais com você, remova hoje.',
  },
  {
    id: 'senha',
    texto: 'Senha forte e diferente das outras contas',
    dica: 'Use uma frase longa que só você conhece. Se a mesma senha vazar em outro site, sua página fica exposta.',
  },
  {
    id: 'alertas',
    texto: 'Alertas de login ativados',
    dica: 'Você recebe um aviso sempre que alguém entrar de um aparelho novo e pode bloquear na hora.',
  },
] as const

export const INCOMODOS = [
  'Não tenho tempo de postar',
  'As artes não ficam profissionais',
  'Mensagens ficam sem resposta',
  'Não sei se dá resultado',
  'Site fora do ar',
  'Tive uma experiência ruim com a última agência',
]

export const TIPOS_NEGOCIO = [
  'Hamburgueria',
  'Pizzaria',
  'Lanchonete',
  'Confeitaria',
  'Açaí',
  'Cafeteria',
  'Restaurante',
  'Bar',
  'Outro',
]

export const PLANOS: Record<Plano, { nome: string; resumo: string; itens: string[]; preco: string }> = {
  automacao: {
    nome: 'Plano Automação',
    resumo: 'A porta de entrada: nenhum cliente fica sem resposta.',
    itens: ['Respostas automáticas no Instagram e no Messenger', 'Perguntas frequentes (preço, cardápio, horário, entrega)', 'Mensagem fora do horário'],
    preco: 'a partir de R$ 97/mês',
  },
  gestao: {
    nome: 'Gestão completa',
    resumo: 'Automação + conteúdo feito para você, com a sua cara.',
    itens: ['Tudo do Plano Automação', 'Calendário mensal com posts agendados', 'Peças no padrão da sua marca, aprovadas por você', 'Relatório e evolução da nota'],
    preco: 'sob consulta',
  },
}

// Os 8 momentos dos 15 dias grátis. O gestor libera cada um no painel.
export const VITORIAS = [
  { id: 'espelho', dia: 1, titulo: 'O espelho', texto: 'Seu diagnóstico está pronto: veja a nota e o que você está perdendo.' },
  { id: 'primeira', dia: 3, titulo: 'A primeira vitória', texto: 'Respondemos 12 clientes enquanto você dormia.' },
  { id: 'orgulho', dia: 5, titulo: 'O orgulho', texto: 'As primeiras peças estão no ar, com a cara da sua marca.' },
  { id: 'envolvimento', dia: 7, titulo: 'O envolvimento', texto: 'Escolha perfis que você admira e sugira a ideia do seu vídeo.' },
  { id: 'video', dia: 10, titulo: 'O vídeo', texto: 'Seu reels de 15 segundos está pronto, com o seu roteiro melhorado.' },
  { id: 'placar', dia: 12, titulo: 'O placar', texto: 'Mensagens respondidas, alcance e a nota subindo: veja o relatório.' },
  { id: 'futuro', dia: 13, titulo: 'O futuro pronto', texto: 'Seu calendário do próximo mês já está planejado.' },
  { id: 'decisao', dia: 14, titulo: 'A decisão', texto: 'Escolha seu plano e continue com tudo funcionando.' },
] as const

// ID de parceiro = ID do portfólio empresarial Studio Vitor Campos.
export const ID_PARCEIRO = '353123935554576'

export function notaGeral(pontos: Ponto[]): number | null {
  const notas = pontos.map((p) => p.nota).filter((n): n is number => n !== null)
  if (notas.length < pontos.length) return null
  return notas.reduce((a, b) => a + b, 0) / notas.length
}

export function notaSeguranca(checklist: Record<string, boolean>): number {
  const feitos = CHECKLIST.filter((c) => checklist[c.id]).length
  return Math.round((feitos / CHECKLIST.length) * 100) / 10
}

export function formatarNota(n: number | null): string {
  if (n === null) return '—'
  return n.toFixed(1).replace('.', ',')
}

export function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function diaDaJornada(inicio: string | undefined, hoje = new Date()): number | null {
  if (!inicio) return null
  const dias = Math.floor((hoje.getTime() - new Date(inicio).getTime()) / 86_400_000)
  return Math.max(0, dias)
}
