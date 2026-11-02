import { useEffect, type ReactNode } from 'react'
import { Link, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { formatarNota, ID_PARCEIRO } from '../data/modelo'
import { useCliente, useStore } from '../store'

export function Logo({ pequeno = false }: { pequeno?: boolean }) {
  return (
    <span className={'logo' + (pequeno ? ' logo--pequeno' : '')}>
      <span className="logo__marca" aria-hidden>
        a
      </span>
      <span className="logo__nome">
        agência <em>num app</em>
      </span>
    </span>
  )
}

export function BarraPrototipo() {
  const { reiniciar, entrar, modoReal, usuario } = useStore()
  const navigate = useNavigate()
  if (modoReal) {
    // No app de verdade, só o gestor vê esta barra (alternar visões e sair)
    if (!usuario?.gestor) return null
    return (
      <div className="prototipo">
        <span>Gestor · {usuario.email}</span>
        <nav>
          <Link to="/">Cliente</Link>
          <Link to="/gestor">Gestor</Link>
          <button onClick={() => entrar(null)}>Sair</button>
        </nav>
      </div>
    )
  }
  return (
    <div className="prototipo">
      <span>Protótipo · dados de exemplo</span>
      <nav>
        <Link to="/">Cliente</Link>
        <Link to="/gestor">Gestor</Link>
        <button
          onClick={() => {
            reiniciar()
            entrar(null)
            navigate('/')
          }}
        >
          Reiniciar
        </button>
      </nav>
    </div>
  )
}

export function Aviso() {
  const { aviso, fecharAviso } = useStore()
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(fecharAviso, 5000)
    return () => clearTimeout(t)
  }, [aviso, fecharAviso])
  if (!aviso) return null
  return (
    <button className="aviso" onClick={fecharAviso}>
      <span className="aviso__app">agência num app · agora</span>
      {aviso}
    </button>
  )
}

export function TelaCliente({ children, titulo, voltar, semMenu = false }: { children: ReactNode; titulo?: string; voltar?: string; semMenu?: boolean }) {
  const { negocio, notificacoes } = useCliente()
  const naoLidas = notificacoes.filter((n) => !n.lida).length
  return (
    <div className="celular">
      <header className="topo">
        {voltar ? (
          <Link to={voltar} className="topo__voltar" aria-label="Voltar">
            ←
          </Link>
        ) : (
          <Logo pequeno />
        )}
        {titulo && <h1 className="topo__titulo">{titulo}</h1>}
        {negocio && (
          <Link to="/avisos" className="sino" aria-label="Avisos">
            🔔{naoLidas > 0 && <span className="sino__conta">{naoLidas}</span>}
          </Link>
        )}
      </header>
      <main className="conteudo">{children}</main>
      {negocio && !semMenu && <MenuCliente />}
    </div>
  )
}

function MenuCliente() {
  const itens = [
    ['/inicio', '🏠', 'Início'],
    ['/resultado', '📋', 'Diagnóstico'],
    ['/evolucao', '📈', 'Evolução'],
    ['/seguranca', '🛡️', 'Segurança'],
  ]
  return (
    <nav className="menu">
      {itens.map(([para, icone, nome]) => (
        <NavLink key={para} to={para} className={({ isActive }) => 'menu__item' + (isActive ? ' ativo' : '')}>
          <span aria-hidden>{icone}</span>
          {nome}
        </NavLink>
      ))}
    </nav>
  )
}

export function Dica({ children, titulo = 'Por que isso importa' }: { children: ReactNode; titulo?: string }) {
  return (
    <aside className="dica">
      <strong>💡 {titulo}</strong>
      <p>{children}</p>
    </aside>
  )
}

export function corDaNota(n: number | null) {
  if (n === null) return 'var(--cinza)'
  if (n < 4) return 'var(--tomate)'
  if (n < 7) return 'var(--mostarda-escura)'
  return 'var(--manjericao)'
}

export function NotaAnel({ nota, tamanho = 120, legenda }: { nota: number | null; tamanho?: number; legenda?: string }) {
  const r = 44
  const c = 2 * Math.PI * r
  const fracao = nota === null ? 0 : nota / 10
  return (
    <figure className="anel" style={{ width: tamanho }}>
      <svg viewBox="0 0 100 100" width={tamanho} height={tamanho}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--creme-escuro)" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={corDaNota(nota)}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${c * fracao} ${c}`}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="56" textAnchor="middle" className="anel__nota">
          {formatarNota(nota)}
        </text>
      </svg>
      {legenda && <figcaption>{legenda}</figcaption>}
    </figure>
  )
}

export function BarraNota({ nota }: { nota: number | null }) {
  return (
    <span className="barra">
      <span style={{ width: `${(nota ?? 0) * 10}%`, background: corDaNota(nota) }} />
    </span>
  )
}

export function ContaSegura() {
  return (
    <section className="conta-segura">
      <h3>🔒 Sua conta segura</h3>
      <ul>
        <li>
          O Studio <strong>nunca</strong> pede sua senha.
        </li>
        <li>
          O Studio <strong>nunca</strong> pede código de verificação (SMS, e-mail ou app).
        </li>
        <li>
          O Studio <strong>nunca</strong> pede Controle total.
        </li>
        <li>
          Confira se o pedido vem de <strong>Studio Vitor Campos</strong> (ID de parceiro <strong>{ID_PARCEIRO}</strong>). Qualquer outro pedido em nome do Studio é golpe.
        </li>
        <li>Ative a autenticação de dois fatores no Instagram e no Facebook.</li>
        <li>Você pode remover o acesso do Studio quando quiser, no próprio Business Suite.</li>
      </ul>
    </section>
  )
}

export function TelaGestor({ children, titulo }: { children: ReactNode; titulo: string }) {
  const { modoReal, usuario, carregando } = useStore()
  if (modoReal && carregando) return <p className="sub">Carregando…</p>
  if (modoReal && !usuario?.gestor) return <Navigate to="/" />
  return (
    <div className="gestor">
      <header className="gestor__topo">
        <Logo pequeno />
        <nav>
          <NavLink to="/gestor" end>
            Diagnósticos
          </NavLink>
          <NavLink to="/gestor/clientes">Clientes</NavLink>
        </nav>
      </header>
      <main className="gestor__conteudo">
        <h1>{titulo}</h1>
        {children}
      </main>
    </div>
  )
}
