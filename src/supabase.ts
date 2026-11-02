// Conexão com o Supabase (etapa 2). Sem as variáveis de ambiente, o app roda
// no modo demonstração (dados de exemplo no navegador).
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Diagnostico, Negocio, Notificacao } from './data/modelo'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const chave = import.meta.env.VITE_SUPABASE_KEY as string | undefined

export const supabase: SupabaseClient | null =
  url && chave ? createClient(url, chave, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } }) : null

export const MODO_REAL = supabase !== null

// ---- conversão banco (snake_case) <-> app (camelCase) ----

type Linha = Record<string, unknown>

export const negocioDoBanco = (r: Linha): Negocio => ({
  id: r.id as string,
  nome: r.nome as string,
  responsavel: r.responsavel as string,
  email: r.email as string,
  tipo: r.tipo as string,
  cidade: r.cidade as string,
  instagram: r.instagram as string,
  facebook: r.facebook as string,
  site: r.site as string,
  whatsapp: r.whatsapp as string,
  incomodos: (r.incomodos as string[]) ?? [],
  checklist: (r.checklist as Record<string, boolean>) ?? {},
  conexao: r.conexao as Negocio['conexao'],
  inicioJornada: (r.inicio_jornada as string | null) ?? undefined,
  vitorias: (r.vitorias as string[]) ?? [],
  materiais: (r.materiais as string[]) ?? [],
  dados: r.dados as Negocio['dados'],
  reavaliacoes: (r.reavaliacoes as Negocio['reavaliacoes']) ?? [],
})

export const negocioParaBanco = (n: Negocio): Linha => ({
  id: n.id,
  nome: n.nome,
  responsavel: n.responsavel,
  email: n.email,
  tipo: n.tipo,
  cidade: n.cidade,
  instagram: n.instagram,
  facebook: n.facebook,
  site: n.site,
  whatsapp: n.whatsapp,
  incomodos: n.incomodos,
  checklist: n.checklist,
  conexao: n.conexao,
  inicio_jornada: n.inicioJornada ?? null,
  vitorias: n.vitorias,
  materiais: n.materiais,
  dados: n.dados,
  reavaliacoes: n.reavaliacoes,
})

export const diagnosticoDoBanco = (r: Linha): Diagnostico => ({
  id: r.id as string,
  negocioId: r.negocio_id as string,
  status: r.status as Diagnostico['status'],
  pedidoEm: r.pedido_em as string,
  publicadoEm: (r.publicado_em as string | null) ?? undefined,
  pontos: (r.pontos as Diagnostico['pontos']) ?? [],
  resumo: r.resumo as string,
  plano: r.plano as Diagnostico['plano'],
  observacoes: r.observacoes as string,
})

export const diagnosticoParaBanco = (d: Diagnostico): Linha => ({
  id: d.id,
  negocio_id: d.negocioId,
  status: d.status,
  pedido_em: d.pedidoEm,
  publicado_em: d.publicadoEm ?? null,
  pontos: d.pontos,
  resumo: d.resumo,
  plano: d.plano,
  observacoes: d.observacoes,
})

export const notificacaoDoBanco = (r: Linha): Notificacao => ({
  id: r.id as string,
  negocioId: r.negocio_id as string,
  data: r.data as string,
  titulo: r.titulo as string,
  texto: r.texto as string,
  lida: r.lida as boolean,
})

export const notificacaoParaBanco = (n: Notificacao): Linha => ({
  id: n.id,
  negocio_id: n.negocioId,
  data: n.data,
  titulo: n.titulo,
  texto: n.texto,
  lida: n.lida,
})

export type Usuario = { id: string; email: string; gestor: boolean }

export async function carregarTudo() {
  if (!supabase) throw new Error('sem supabase')
  const [neg, diag, notif] = await Promise.all([
    supabase.from('negocios').select('*').order('criado_em'),
    supabase.from('diagnosticos').select('*').order('pedido_em'),
    supabase.from('notificacoes').select('*').order('data', { ascending: false }),
  ])
  const erro = neg.error ?? diag.error ?? notif.error
  if (erro) throw erro
  return {
    negocios: (neg.data ?? []).map(negocioDoBanco),
    diagnosticos: (diag.data ?? []).map(diagnosticoDoBanco),
    notificacoes: (notif.data ?? []).map(notificacaoDoBanco),
  }
}

// Grava só o que mudou entre dois estados (comparação por referência: os
// redutores do app sempre criam objetos novos para o que alteram).
export async function gravarMudancas<T extends { id: string }>(
  tabela: string,
  antes: T[],
  depois: T[],
  paraBanco: (x: T) => Linha,
) {
  if (!supabase) return
  const anteriores = new Map(antes.map((x) => [x.id, x]))
  const novos = depois.filter((x) => !anteriores.has(x.id))
  const alterados = depois.filter((x) => anteriores.has(x.id) && anteriores.get(x.id) !== x)
  if (novos.length) {
    const { error } = await supabase.from(tabela).insert(novos.map(paraBanco))
    if (error) throw error
  }
  for (const x of alterados) {
    const { id, ...resto } = paraBanco(x)
    const { error } = await supabase.from(tabela).update(resto).eq('id', id)
    if (error) throw error
  }
}
