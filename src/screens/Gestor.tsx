// Painel do gestor (só o Vitor): diagnósticos, publicação e acompanhamento dos clientes.
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BarraNota, NotaAnel, TelaGestor } from '../components/ui'
import {
  CHECKLIST,
  diaDaJornada,
  formatarData,
  formatarNota,
  notaGeral,
  notaSeguranca,
  PLANOS,
  PONTOS,
  VITORIAS,
  type Plano,
  type StatusConexao,
  type StatusDiagnostico,
} from '../data/modelo'
import { useStore } from '../store'

const NOME_STATUS: Record<StatusDiagnostico, string> = { recebido: 'Recebido', analise: 'Em análise', pronto: 'Pronto' }
const NOME_CONEXAO: Record<StatusConexao, string> = {
  pendente: 'Sem conexão',
  solicitado: 'Mandar pedido',
  pedido: 'Pedido enviado',
  aguardando: 'Cliente diz que aprovou',
  conectado: 'Conectado',
}

function linkInstagram(arroba: string) {
  return `https://instagram.com/${arroba.replace('@', '')}`
}

// 1. Lista de diagnósticos
export function Diagnosticos() {
  const { diagnosticos, negocios } = useStore()
  const ordenados = [...diagnosticos].sort((a, b) => (a.status === 'pronto' ? 1 : 0) - (b.status === 'pronto' ? 1 : 0) || b.pedidoEm.localeCompare(a.pedidoEm))

  return (
    <TelaGestor titulo="Diagnósticos">
      <table className="tabela">
        <thead>
          <tr>
            <th>Negócio</th>
            <th>Pedido</th>
            <th>Status</th>
            <th>Perfis</th>
            <th>Nota</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {ordenados.map((d) => {
            const n = negocios.find((x) => x.id === d.negocioId)!
            return (
              <tr key={d.id}>
                <td>
                  <strong>{n.nome}</strong>
                  <br />
                  <span className="miudo">
                    {n.tipo} · {n.cidade}
                  </span>
                </td>
                <td>{formatarData(d.pedidoEm)}</td>
                <td>
                  <span className={'status status--' + d.status}>{NOME_STATUS[d.status]}</span>
                </td>
                <td className="links">
                  <a href={linkInstagram(n.instagram)} target="_blank" rel="noreferrer">
                    Instagram
                  </a>
                  {n.facebook && (
                    <a href={n.facebook} target="_blank" rel="noreferrer">
                      Facebook
                    </a>
                  )}
                  {n.site && (
                    <a href={n.site.startsWith('http') ? n.site : 'https://' + n.site} target="_blank" rel="noreferrer">
                      Site
                    </a>
                  )}
                </td>
                <td>{formatarNota(notaGeral(d.pontos))}</td>
                <td>
                  <Link className="botao botao--pequeno" to={`/gestor/diagnostico/${d.id}`}>
                    {d.status === 'pronto' ? 'Ver' : 'Preencher'}
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </TelaGestor>
  )
}

// 2. Formulário do diagnóstico
export function FormDiagnostico() {
  const { id } = useParams()
  const { diagnosticos, negocios, mudarDiagnostico, publicar } = useStore()
  const navigate = useNavigate()
  const d = diagnosticos.find((x) => x.id === id)
  if (!d) return <TelaGestor titulo="Não encontrado">Diagnóstico não existe.</TelaGestor>
  const n = negocios.find((x) => x.id === d.negocioId)!
  const geral = notaGeral(d.pontos)
  const pronto = geral !== null && d.resumo.trim().length > 0

  const mudarPonto = (pid: string, patch: Partial<(typeof d.pontos)[number]>) => {
    mudarDiagnostico(d.id, {
      status: d.status === 'recebido' ? 'analise' : d.status,
      pontos: d.pontos.map((p) => (p.id === pid ? { ...p, ...patch } : p)),
    })
  }

  return (
    <TelaGestor titulo={n.nome}>
      <section className="ficha">
        <div>
          <p>
            <strong>{n.responsavel}</strong> · {n.email} · {n.whatsapp}
          </p>
          <p>
            {n.tipo} · {n.cidade}
          </p>
          <p>
            <a href={linkInstagram(n.instagram)} target="_blank" rel="noreferrer">
              @{n.instagram}
            </a>
            {n.facebook && (
              <>
                {' · '}
                <a href={n.facebook} target="_blank" rel="noreferrer">
                  Facebook
                </a>
              </>
            )}
            {n.site && <> · {n.site}</>}
          </p>
          <p className="miudo">O que incomoda: {n.incomodos.join(' · ') || '—'}</p>
        </div>
        <NotaAnel nota={geral} tamanho={96} legenda="nota geral" />
      </section>

      {PONTOS.map((def, i) => {
        const p = d.pontos.find((x) => x.id === def.id)!
        return (
          <fieldset key={def.id} className="ponto-form">
            <legend>
              {i + 1}. {def.titulo}
            </legend>
            <div className="notas">
              {Array.from({ length: 11 }, (_, v) => (
                <button key={v} type="button" className={p.nota === v ? 'ativa' : ''} onClick={() => mudarPonto(def.id, { nota: v })}>
                  {v}
                </button>
              ))}
            </div>
            <textarea rows={3} placeholder="O que encontramos, na linguagem do cliente" value={p.comentario} onChange={(e) => mudarPonto(def.id, { comentario: e.target.value })} />
            <label className="upload upload--pequeno">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => mudarPonto(def.id, { prints: [...p.prints, ...Array.from(e.target.files ?? []).map((f) => f.name)] })}
              />
              <span>＋ Prints {p.prints.length > 0 && `(${p.prints.length})`}</span>
            </label>
          </fieldset>
        )
      })}

      <fieldset className="ponto-form">
        <legend>7. Segurança da conta (respondido pelo cliente)</legend>
        <p>
          Nota <strong>{formatarNota(notaSeguranca(n.checklist))}</strong> ·{' '}
          {CHECKLIST.filter((c) => !n.checklist[c.id])
            .map((c) => c.texto)
            .join('; ') || 'tudo em dia'}
        </p>
      </fieldset>

      <label className="campo">
        Resumo (até 3 frases)
        <textarea rows={3} value={d.resumo} onChange={(e) => mudarDiagnostico(d.id, { resumo: e.target.value })} />
      </label>
      <label className="campo">
        Plano recomendado
        <select value={d.plano} onChange={(e) => mudarDiagnostico(d.id, { plano: e.target.value as Plano })}>
          {Object.entries(PLANOS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="campo">
        Observações internas (o cliente não vê)
        <textarea rows={2} value={d.observacoes} onChange={(e) => mudarDiagnostico(d.id, { observacoes: e.target.value })} />
      </label>

      <div className="acoes">
        {d.status === 'pronto' ? (
          <p className="selo-ok">Publicado em {formatarData(d.publicadoEm!)}.</p>
        ) : (
          <button
            className="botao"
            disabled={!pronto}
            onClick={() => {
              publicar(d.id)
              navigate('/gestor')
            }}
          >
            Publicar e avisar o cliente
          </button>
        )}
        {!pronto && d.status !== 'pronto' && <p className="miudo">Para publicar: nota nos 6 pontos e o resumo.</p>}
      </div>
    </TelaGestor>
  )
}

// 3 e 4. Clientes: conexão, jornada, vitórias, reavaliação e avisos
export function Clientes() {
  const { negocios, diagnosticos, enviarPedido, confirmarConexao, liberarVitoria, enviarNotificacao, reavaliar } = useStore()
  const [aberto, setAberto] = useState<string | null>(null)
  const [aviso, setAviso] = useState({ titulo: '', texto: '' })
  const [notas, setNotas] = useState<Record<string, number>>({})

  const comDiagnostico = negocios.filter((n) => diagnosticos.find((d) => d.negocioId === n.id)?.status === 'pronto')

  return (
    <TelaGestor titulo="Clientes">
      {comDiagnostico.length === 0 && <p>Nenhum cliente com diagnóstico publicado ainda.</p>}
      {comDiagnostico.map((n) => {
        const d = diagnosticos.find((x) => x.negocioId === n.id)!
        const dia = diaDaJornada(n.inicioJornada)
        const ultima = n.reavaliacoes.at(-1)
        const aberto_ = aberto === n.id
        return (
          <article key={n.id} className="cliente">
            <header onClick={() => setAberto(aberto_ ? null : n.id)}>
              <div>
                <h2>{n.nome}</h2>
                <span className="miudo">
                  Dia {dia ?? '—'} de 15 · nota {formatarNota(notaGeral(d.pontos))}
                  {ultima && ` → ${formatarNota(Object.values(ultima.notas).reduce((a, b) => a + b, 0) / Object.values(ultima.notas).length)}`}
                </span>
              </div>
              <span className={'status status--' + n.conexao}>
                {NOME_CONEXAO[n.conexao]}
              </span>
            </header>

            {aberto_ && (
              <div className="cliente__corpo">
                {n.conexao === 'solicitado' && (
                  <div className="bloco">
                    <p>
                      O cliente autorizou. No portfólio do Studio, peça acesso parcial à página{' '}
                      {n.facebook ? (
                        <a href={n.facebook} target="_blank" rel="noreferrer">
                          {n.facebook.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <b>{n.nome}</b>
                      )}{' '}
                      e ao Instagram <b>@{n.instagram}</b>. Anúncios desligados.
                    </p>
                    <button className="botao botao--pequeno" onClick={() => enviarPedido(n.id)}>
                      Pedido enviado: avisar o cliente
                    </button>
                  </div>
                )}

                {n.conexao === 'pedido' && (
                  <div className="bloco">
                    <p>Pedido enviado. Aguardando o cliente aprovar no Facebook ou no Business Suite.</p>
                    <button className="botao botao--pequeno botao--contorno" onClick={() => confirmarConexao(n.id)}>
                      Já apareceu como aprovado
                    </button>
                  </div>
                )}

                {n.conexao === 'aguardando' && (
                  <div className="bloco">
                    <p>O cliente diz que aprovou. Confira no portfólio do Studio se a página e o Instagram chegaram com acesso parcial.</p>
                    <button className="botao botao--pequeno" onClick={() => confirmarConexao(n.id)}>
                      Confirmar conexão
                    </button>
                  </div>
                )}

                <div className="bloco">
                  <h3>Vitórias dos 15 dias</h3>
                  <ul className="vitorias">
                    {VITORIAS.map((v) => {
                      const ok = n.vitorias.includes(v.id)
                      return (
                        <li key={v.id}>
                          <span>
                            Dia {v.dia} · <strong>{v.titulo}</strong>: {v.texto}
                          </span>
                          {ok ? (
                            <span className="miudo">✓ enviada</span>
                          ) : (
                            <button className="botao botao--pequeno botao--contorno" onClick={() => liberarVitoria(n.id, v.id)}>
                              Liberar e avisar
                            </button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>

                <div className="bloco">
                  <h3>Reavaliação</h3>
                  <div className="reavaliacao">
                    {PONTOS.map((p) => (
                      <label key={p.id}>
                        {p.titulo}
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.5}
                          value={notas[p.id] ?? ''}
                          placeholder={formatarNota(ultima?.notas[p.id] ?? d.pontos.find((x) => x.id === p.id)!.nota)}
                          onChange={(e) => setNotas({ ...notas, [p.id]: Number(e.target.value) })}
                        />
                        <BarraNota nota={notas[p.id] ?? null} />
                      </label>
                    ))}
                  </div>
                  <button
                    className="botao botao--pequeno"
                    disabled={PONTOS.some((p) => notas[p.id] === undefined)}
                    onClick={() => {
                      reavaliar(n.id, notas)
                      setNotas({})
                    }}
                  >
                    Salvar reavaliação
                  </button>
                </div>

                <div className="bloco">
                  <h3>Enviar aviso</h3>
                  <input placeholder="Título (ex.: Seu post de sábado está no ar)" value={aviso.titulo} onChange={(e) => setAviso({ ...aviso, titulo: e.target.value })} />
                  <input placeholder="Texto curto" value={aviso.texto} onChange={(e) => setAviso({ ...aviso, texto: e.target.value })} />
                  <button
                    className="botao botao--pequeno"
                    disabled={!aviso.titulo}
                    onClick={() => {
                      enviarNotificacao(n.id, aviso.titulo, aviso.texto)
                      setAviso({ titulo: '', texto: '' })
                    }}
                  >
                    Enviar
                  </button>
                </div>

                <div className="bloco miudo">
                  Materiais: {n.materiais.join(', ') || 'nenhum'} · Horário: {n.dados.horario || '—'} · Cardápio: {n.dados.cardapio || '—'}
                </div>
              </div>
            )}
          </article>
        )
      })}
    </TelaGestor>
  )
}
