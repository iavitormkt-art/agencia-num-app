// Dados de exemplo do protótipo. A Moranguinho usa as notas reais do diagnóstico
// de 22/10/2026, agrupadas nos 6 pontos do app (média 3,4). Os outros negócios são fictícios.
import type { Diagnostico, Negocio, Notificacao } from './modelo'

const dadosVazios = { horario: '', endereco: '', cardapio: '', perguntas: '', whatsapps: '' }

export const negociosExemplo: Negocio[] = [
  {
    id: 'moranguinho',
    nome: 'Moranguinho Confeitaria',
    responsavel: 'Paulla',
    email: 'paulla@exemplo.com',
    tipo: 'Confeitaria',
    cidade: 'Samambaia e Ceilândia (DF)',
    instagram: 'moranguinhoconfeitaria',
    facebook: 'https://facebook.com/moranguinhoconfeitaria',
    site: 'moranguinhoconfeitaria.com.br',
    whatsapp: '(61) 90000-1000',
    incomodos: ['Não tenho tempo de postar', 'Mensagens ficam sem resposta', 'Site fora do ar'],
    checklist: { '2fa': true, contato: true, controle: false, revisao: false, senha: true, alertas: false },
    conexao: 'pedido',
    inicioJornada: '2026-10-25T09:00:00-03:00',
    vitorias: ['espelho', 'primeira'],
    materiais: ['logo-moranguinho.png', 'foto-bolo-suflê.jpg', 'cardapio-encomendas.pdf'],
    dados: {
      horario: 'Seg a sáb, 9h às 20h',
      endereco: 'Samambaia e QNM 18, Ceilândia',
      cardapio: 'linktr.ee/moranguinhoconfeitaria',
      perguntas: 'Fazem bolo para 20 pessoas? Qual o valor do kg? A loja da Ceilândia está aberta?',
      whatsapps: 'Samambaia (61) 90000-1000 · Ceilândia (61) 90000-2000',
    },
    reavaliacoes: [
      {
        data: '2026-10-29T18:00:00-03:00',
        notas: { mensagens: 7, comentarios: 6, bio: 7, frequencia: 4, identidade: 5, destaques: 6 },
      },
    ],
  },
  {
    id: 'forno-de-pedra',
    nome: 'Forno de Pedra Pizzaria',
    responsavel: 'Marcos',
    email: 'marcos@exemplo.com',
    tipo: 'Pizzaria',
    cidade: 'Taguatinga (DF)',
    instagram: 'fornodepedra.exemplo',
    facebook: '',
    site: '',
    whatsapp: '(61) 90000-0001',
    incomodos: ['As artes não ficam profissionais', 'Não sei se dá resultado'],
    checklist: { '2fa': false, contato: true, controle: true, revisao: true, senha: false, alertas: false },
    conexao: 'pendente',
    vitorias: [],
    materiais: [],
    dados: dadosVazios,
    reavaliacoes: [],
  },
  {
    id: 'acai-da-praca',
    nome: 'Açaí da Praça',
    responsavel: 'Juliana',
    email: 'juliana@exemplo.com',
    tipo: 'Açaí',
    cidade: 'Águas Claras (DF)',
    instagram: 'acaidapraca.exemplo',
    facebook: 'https://facebook.com/acaidapraca.exemplo',
    site: '',
    whatsapp: '(61) 90000-0002',
    incomodos: ['Não tenho tempo de postar', 'Mensagens ficam sem resposta'],
    checklist: {},
    conexao: 'pendente',
    vitorias: [],
    materiais: [],
    dados: dadosVazios,
    reavaliacoes: [],
  },
]

const pontosVazios = () =>
  ['mensagens', 'comentarios', 'bio', 'frequencia', 'identidade', 'destaques'].map((id) => ({
    id,
    nota: null,
    comentario: '',
    prints: [],
  }))

export const diagnosticosExemplo: Diagnostico[] = [
  {
    id: 'd-moranguinho',
    negocioId: 'moranguinho',
    status: 'pronto',
    pedidoEm: '2026-10-22T19:00:00-03:00',
    publicadoEm: '2026-10-23T12:00:00-03:00',
    pontos: [
      {
        id: 'mensagens',
        nota: 2,
        comentario:
          'Perguntamos "Vocês fazem bolo para 20 pessoas? Qual o valor?" no Instagram e no Messenger. O Instagram não respondeu nada; o Messenger só mandou chamar no WhatsApp. Ninguém respondeu em mais de 14 horas.',
        prints: ['DM de teste sem resposta', 'Resposta automática do Messenger'],
      },
      {
        id: 'comentarios',
        nota: 1,
        comentario:
          '8 clientes comentaram nos últimos 11 posts (preço do kg, se a loja está aberta) e nenhum recebeu resposta. Uma cliente escreveu que desistiu do bolo de aniversário.',
        prints: ['Comentários sem resposta'],
      },
      {
        id: 'bio',
        nota: 6,
        comentario:
          'O link da bio funciona e leva aos dois WhatsApps e aos cardápios. Mas o site moranguinhoconfeitaria.com.br está fora do ar e a mensagem do WhatsApp chega só como "WhatsApp".',
        prints: ['Site fora do ar'],
      },
      {
        id: 'frequencia',
        nota: 2,
        comentario: '1 post nos últimos 30 dias. Antes disso, 8 posts em um mês, com dias de dois posts e semanas sem nada.',
        prints: ['Topo do feed'],
      },
      {
        id: 'identidade',
        nota: 5,
        comentario: 'Fotos de produto bonitas, mas cada peça tem uma fonte e um estilo. O logo aparece em umas e some em outras.',
        prints: ['Feed com estilos diferentes'],
      },
      {
        id: 'destaques',
        nota: 4.5,
        comentario:
          '13 destaques, mas nenhum de Cardápio ou Encomendas. No Facebook, a bio está cortada, só aparece a loja da Ceilândia e as avaliações estão desativadas.',
        prints: ['Topo da página do Facebook'],
      },
    ],
    resumo:
      'Tem clientes perguntando preço e horário todos os dias, e eles ficam sem resposta. O perfil é forte (35 mil seguidores), mas está parado. Ligando as respostas automáticas, a venda que hoje escapa volta para a loja.',
    plano: 'gestao',
    observacoes: 'Confirmar se a loja da Ceilândia está funcionando.',
  },
  {
    id: 'd-forno',
    negocioId: 'forno-de-pedra',
    status: 'recebido',
    pedidoEm: '2026-10-29T21:30:00-03:00',
    pontos: pontosVazios(),
    resumo: '',
    plano: 'automacao',
    observacoes: '',
  },
  {
    id: 'd-acai',
    negocioId: 'acai-da-praca',
    status: 'analise',
    pedidoEm: '2026-10-28T15:10:00-03:00',
    pontos: pontosVazios(),
    resumo: '',
    plano: 'automacao',
    observacoes: '',
  },
]

export const notificacoesExemplo: Notificacao[] = [
  {
    id: 'n1',
    negocioId: 'moranguinho',
    data: '2026-10-23T12:00:00-03:00',
    titulo: 'Seu diagnóstico está pronto',
    texto: 'Veja a nota do seu perfil e o que você está perdendo.',
    lida: true,
  },
  {
    id: 'n2',
    negocioId: 'moranguinho',
    data: '2026-10-28T07:30:00-03:00',
    titulo: 'Respondemos 12 clientes enquanto você dormia',
    texto: 'As respostas automáticas já estão no ar.',
    lida: false,
  },
]
