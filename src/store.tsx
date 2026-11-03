// Estado do app. Modo demonstração: dados de exemplo no navegador (localStorage).
// Modo real (etapa 2): mesmo estado, carregado e gravado no Supabase.
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { diagnosticosExemplo, negociosExemplo, notificacoesExemplo } from './data/exemplo'
import { PONTOS, VITORIAS, type Diagnostico, type Negocio, type Notificacao } from './data/modelo'
import {
  carregarTudo,
  diagnosticoParaBanco,
  gravarMudancas,
  MODO_REAL,
  negocioParaBanco,
  notificacaoParaBanco,
  supabase,
  type Usuario,
} from './supabase'

type Estado = {
  negocios: Negocio[]
  diagnosticos: Diagnostico[]
  notificacoes: Notificacao[]
  sessao: string | null
  aviso: string | null
  usuario: Usuario | null
  carregando: boolean
}

const CHAVE = 'agencia-num-app:prototipo:v2'

const inicial = (): Estado =>
  MODO_REAL
    ? { negocios: [], diagnosticos: [], notificacoes: [], sessao: null, aviso: null, usuario: null, carregando: true }
    : {
        negocios: negociosExemplo,
        diagnosticos: diagnosticosExemplo,
        notificacoes: notificacoesExemplo,
        sessao: null,
        aviso: null,
        usuario: null,
        carregando: false,
      }

function carregar(): Estado {
  if (MODO_REAL) return inicial()
  // Protótipo: ?como=<id> entra direto como um cliente de exemplo.
  const como = new URLSearchParams(location.search).get('como')
  let estado = inicial()
  try {
    const salvo = localStorage.getItem(CHAVE)
    if (salvo) estado = { ...estado, ...JSON.parse(salvo), aviso: null, usuario: null, carregando: false }
  } catch {
    // estado corrompido: volta ao exemplo
  }
  return como ? { ...estado, sessao: como } : estado
}

const agora = () => new Date().toISOString()
const novoId = () => crypto.randomUUID()

// Endereço de volta do link mágico / Google: a própria página, sem o #.
const enderecoDeVolta = () => location.origin + location.pathname

function useLoja() {
  const [estado, setEstado] = useState<Estado>(carregar)
  const gravado = useRef<Estado | null>(null) // último estado igual ao do banco

  // Demonstração: guarda no navegador
  useEffect(() => {
    if (MODO_REAL) return
    try {
      localStorage.setItem(CHAVE, JSON.stringify({ ...estado, aviso: null }))
    } catch {
      // sem localStorage (ex.: página publicada em moldura restrita): segue só em memória
    }
  }, [estado])

  // Real: login + carga inicial
  useEffect(() => {
    if (!supabase) return
    const sb = supabase
    const abrir = async (uid: string | null, email: string | null) => {
      if (!uid) {
        gravado.current = null
        setEstado({ ...inicial(), carregando: false })
        return
      }
      try {
        const [perfil, tudo, meu] = await Promise.all([
          sb.from('perfis').select('papel').eq('id', uid).maybeSingle(),
          carregarTudo(),
          sb.from('negocios').select('id').eq('dono', uid).order('criado_em').limit(1),
        ])
        const novo: Estado = {
          ...tudo,
          sessao: meu.data?.[0]?.id ?? null,
          aviso: null,
          usuario: { id: uid, email: email ?? '', gestor: perfil.data?.papel === 'gestor' },
          carregando: false,
        }
        gravado.current = novo
        setEstado(novo)
        // limpa o ?code= do link mágico
        if (location.search) history.replaceState(null, '', location.pathname + location.hash)
      } catch (e) {
        console.error(e)
        setEstado((s) => ({ ...s, carregando: false, aviso: 'Não foi possível carregar seus dados. Tente de novo.' }))
      }
    }
    sb.auth.getSession().then(({ data }) => abrir(data.session?.user.id ?? null, data.session?.user.email ?? null))
    const { data: escuta } = sb.auth.onAuthStateChange((evento, sessao) => {
      if (evento === 'SIGNED_IN' || evento === 'SIGNED_OUT') abrir(sessao?.user.id ?? null, sessao?.user.email ?? null)
    })
    return () => escuta.subscription.unsubscribe()
  }, [])

  // Real: grava as mudanças (agrupadas, 0,6 s depois da última)
  useEffect(() => {
    if (!MODO_REAL || !gravado.current || estado.carregando) return
    const t = setTimeout(async () => {
      const antes = gravado.current
      if (!antes) return
      try {
        await gravarMudancas('negocios', antes.negocios, estado.negocios, negocioParaBanco)
        await gravarMudancas('diagnosticos', antes.diagnosticos, estado.diagnosticos, diagnosticoParaBanco)
        await gravarMudancas('notificacoes', antes.notificacoes, estado.notificacoes, notificacaoParaBanco)
        gravado.current = estado
      } catch (e) {
        console.error(e)
        setEstado((s) => ({ ...s, aviso: 'Não foi possível salvar. Confira a internet e tente de novo.' }))
      }
    }, 600)
    return () => clearTimeout(t)
  }, [estado])

  const notificar = (s: Estado, negocioId: string, titulo: string, texto: string): Estado => ({
    ...s,
    notificacoes: [{ id: novoId(), negocioId, data: agora(), titulo, texto, lida: false }, ...s.notificacoes],
    aviso: s.sessao === negocioId ? titulo : s.aviso,
  })

  const mudarNegocio = (id: string, patch: Partial<Negocio>) =>
    setEstado((s) => ({ ...s, negocios: s.negocios.map((n) => (n.id === id ? { ...n, ...patch } : n)) }))

  const mudarDiagnostico = (id: string, patch: Partial<Diagnostico>) =>
    setEstado((s) => ({ ...s, diagnosticos: s.diagnosticos.map((d) => (d.id === id ? { ...d, ...patch } : d)) }))

  return {
    ...estado,
    modoReal: MODO_REAL,
    entrar: async (negocioId: string | null) => {
      if (MODO_REAL) {
        if (negocioId === null && supabase) {
          // 'local' sai mesmo sem internet; limpa a tela na hora
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
          gravado.current = null
          setEstado({ ...inicial(), carregando: false })
        }
        return
      }
      setEstado((s) => ({ ...s, sessao: negocioId }))
    },
    // Console do gestor: e-mail + senha. Devolve uma mensagem de erro ou null.
    entrarComSenha: async (email: string, senha: string): Promise<string | null> => {
      if (!supabase) return null
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      return error ? error.message : null
    },
    // O gestor logado define/troca a própria senha (ele mesmo digita).
    definirSenha: async (senha: string): Promise<string | null> => {
      if (!supabase) return null
      const { error } = await supabase.auth.updateUser({ password: senha })
      return error ? error.message : null
    },
    // Login sem senha. Devolve uma mensagem de erro ou null.
    entrarComEmail: async (email: string): Promise<string | null> => {
      if (!supabase) return null
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: enderecoDeVolta() } })
      return error ? error.message : null
    },
    entrarComGoogle: async (): Promise<string | null> => {
      if (!supabase) return null
      // Confere antes se o Google está ligado no Supabase (senão ele mostra uma página de erro crua)
      try {
        const r = await fetch(import.meta.env.VITE_SUPABASE_URL + '/auth/v1/settings', {
          headers: { apikey: import.meta.env.VITE_SUPABASE_KEY },
        })
        const cfg = await r.json()
        if (!cfg?.external?.google) return 'google-desligado'
      } catch {
        return 'google-desligado'
      }
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: enderecoDeVolta() } })
      return error ? error.message : null
    },
    fecharAviso: () => setEstado((s) => ({ ...s, aviso: null })),
    reiniciar: () => {
      if (!MODO_REAL) setEstado(inicial())
    },

    cadastrar: (dados: Omit<Negocio, 'id' | 'checklist' | 'conexao' | 'vitorias' | 'materiais' | 'dados' | 'reavaliacoes'>) => {
      const id = novoId()
      setEstado((s) => ({
        ...s,
        sessao: id,
        negocios: [
          ...s.negocios,
          {
            ...dados,
            email: dados.email || s.usuario?.email || '',
            id,
            checklist: {},
            conexao: 'pendente',
            vitorias: [],
            materiais: [],
            dados: { horario: '', endereco: '', cardapio: '', perguntas: '', whatsapps: '' },
            reavaliacoes: [],
          },
        ],
        diagnosticos: [
          ...s.diagnosticos,
          {
            id: novoId(),
            negocioId: id,
            status: 'recebido',
            pedidoEm: agora(),
            pontos: PONTOS.map((p) => ({ id: p.id, nota: null, comentario: '', prints: [] })),
            resumo: '',
            plano: 'automacao',
            observacoes: '',
          },
        ],
      }))
    },

    mudarNegocio,
    mudarDiagnostico,

    marcarItem: (negocioId: string, item: string, feito: boolean) =>
      setEstado((s) => ({
        ...s,
        negocios: s.negocios.map((n) => (n.id === negocioId ? { ...n, checklist: { ...n.checklist, [item]: feito } } : n)),
      })),

    publicar: (diagnosticoId: string) =>
      setEstado((s) => {
        const d = s.diagnosticos.find((x) => x.id === diagnosticoId)
        if (!d) return s
        const comStatus: Estado = {
          ...s,
          diagnosticos: s.diagnosticos.map((x) => (x.id === diagnosticoId ? { ...x, status: 'pronto', publicadoEm: agora() } : x)),
          negocios: s.negocios.map((n) =>
            n.id === d.negocioId
              ? { ...n, inicioJornada: n.inicioJornada ?? agora(), vitorias: n.vitorias.includes('espelho') ? n.vitorias : [...n.vitorias, 'espelho'] }
              : n,
          ),
        }
        return notificar(comStatus, d.negocioId, 'Seu diagnóstico está pronto', 'Veja a nota do seu perfil e o que você está perdendo.')
      }),

    // Cliente autoriza → gestor manda o pedido pelo portfólio do Studio → cliente aprova → gestor confirma.
    solicitarConexao: (negocioId: string) => mudarNegocio(negocioId, { conexao: 'solicitado' }),

    enviarPedido: (negocioId: string) =>
      setEstado((s) =>
        notificar(
          { ...s, negocios: s.negocios.map((n) => (n.id === negocioId ? { ...n, conexao: 'pedido' } : n)) },
          negocioId,
          'Seu pedido de acesso chegou',
          'Abra o Facebook ou o Business Suite e toque em Aprovar. Confira se é o Studio Vitor Campos.',
        ),
      ),

    pedirConexao: (negocioId: string) => mudarNegocio(negocioId, { conexao: 'aguardando' }),

    confirmarConexao: (negocioId: string) =>
      setEstado((s) =>
        notificar(
          { ...s, negocios: s.negocios.map((n) => (n.id === negocioId ? { ...n, conexao: 'conectado' } : n)) },
          negocioId,
          'Studio conectado à sua página',
          'Tudo certo com o acesso parcial. A automação entra no ar nos próximos dias.',
        ),
      ),

    liberarVitoria: (negocioId: string, vitoriaId: string) =>
      setEstado((s) => {
        const v = VITORIAS.find((x) => x.id === vitoriaId)
        if (!v) return s
        const comVitoria: Estado = {
          ...s,
          negocios: s.negocios.map((n) => (n.id === negocioId && !n.vitorias.includes(vitoriaId) ? { ...n, vitorias: [...n.vitorias, vitoriaId] } : n)),
        }
        return notificar(comVitoria, negocioId, v.texto, `Dia ${v.dia}: ${v.titulo}`)
      }),

    enviarNotificacao: (negocioId: string, titulo: string, texto: string) => setEstado((s) => notificar(s, negocioId, titulo, texto)),

    reavaliar: (negocioId: string, notas: Record<string, number>) =>
      setEstado((s) =>
        notificar(
          {
            ...s,
            negocios: s.negocios.map((n) => (n.id === negocioId ? { ...n, reavaliacoes: [...n.reavaliacoes, { data: agora(), notas }] } : n)),
          },
          negocioId,
          'Sua nota foi atualizada',
          'Veja quanto o seu perfil evoluiu desde o diagnóstico.',
        ),
      ),

    marcarLidas: (negocioId: string) =>
      setEstado((s) => ({ ...s, notificacoes: s.notificacoes.map((n) => (n.negocioId === negocioId ? { ...n, lida: true } : n)) })),
  }
}

type Loja = ReturnType<typeof useLoja>
const Contexto = createContext<Loja | null>(null)

export function LojaProvider({ children }: { children: ReactNode }) {
  const loja = useLoja()
  return <Contexto.Provider value={loja}>{children}</Contexto.Provider>
}

export function useStore(): Loja {
  const loja = useContext(Contexto)
  if (!loja) throw new Error('useStore fora do LojaProvider')
  return loja
}

// Atalho para as telas do cliente: negócio logado e o diagnóstico dele.
export function useCliente() {
  const loja = useStore()
  const negocio = loja.negocios.find((n) => n.id === loja.sessao) ?? null
  const diagnostico = negocio ? loja.diagnosticos.find((d) => d.negocioId === negocio.id) ?? null : null
  const notificacoes = negocio ? loja.notificacoes.filter((n) => n.negocioId === negocio.id) : []
  return { loja, negocio, diagnostico, notificacoes }
}
