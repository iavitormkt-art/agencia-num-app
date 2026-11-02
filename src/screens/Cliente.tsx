// Telas do cliente (dono do negócio).
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { BarraNota, ContaSegura, Dica, Logo, NotaAnel, TelaCliente } from '../components/ui'
import {
  CHECKLIST,
  diaDaJornada,
  formatarData,
  formatarNota,
  ID_PARCEIRO,
  INCOMODOS,
  notaGeral,
  notaSeguranca,
  PLANOS,
  PONTOS,
  TIPOS_NEGOCIO,
  VITORIAS,
} from '../data/modelo'
import { useCliente, useStore } from '../store'

// 1. Boas-vindas + login (sem senha: link mágico ou Google)
export function BoasVindas() {
  const { negocios, entrar, sessao, modoReal, usuario, carregando, entrarComEmail, entrarComGoogle } = useStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (carregando) return <div className="celular boas-vindas"><main className="conteudo"><Logo /><p className="sub">Carregando…</p></main></div>
  if (sessao) return <Navigate to="/inicio" />
  if (modoReal && usuario) return <Navigate to={usuario.gestor ? '/gestor' : '/cadastro'} />

  const pedirLink = async () => {
    if (!modoReal) return setEnviado(true)
    setEnviando(true)
    setErro(null)
    const falha = await entrarComEmail(email)
    setEnviando(false)
    if (falha) setErro('Não deu para enviar o link agora. Confira o e-mail e tente de novo em instantes.')
    else setEnviado(true)
  }

  const google = async () => {
    if (!modoReal) return navigate('/cadastro')
    const falha = await entrarComGoogle()
    if (falha) setErro('O login com Google chega em breve. Por enquanto, digite seu e-mail acima e toque em "Receber link de acesso".')
  }

  return (
    <div className="celular boas-vindas">
      <main className="conteudo">
        <Logo />
        <h1 className="chamada">Sua agência de marketing, no bolso.</h1>
        <p className="sub">Diagnóstico grátis do seu Instagram e 15 dias com a gente cuidando das suas redes. Feito para quem vende comida.</p>

        {!enviado ? (
          <form
            className="cartao"
            onSubmit={(e) => {
              e.preventDefault()
              pedirLink()
            }}
          >
            <label>
              Seu e-mail
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@seunegocio.com.br" />
            </label>
            <button className="botao" disabled={enviando}>{enviando ? 'Enviando…' : 'Receber link de acesso'}</button>
            <button type="button" className="botao botao--contorno" onClick={google}>
              <span className="g">G</span> Entrar com Google
            </button>
            {erro && <p className="miudo erro">{erro}</p>}
            <p className="miudo">Sem senha. Você recebe um link no e-mail e entra com um toque.</p>
          </form>
        ) : (
          <div className="cartao">
            <h2>📬 Confira seu e-mail</h2>
            <p>
              Mandamos um link para <strong>{email}</strong>. Toque nele para entrar.
            </p>
            {modoReal ? (
              <p className="miudo">Não chegou? Olhe a caixa de spam ou promoções.</p>
            ) : (
              <button className="botao" onClick={() => navigate('/cadastro')}>
                (Protótipo) Abrir o link
              </button>
            )}
          </div>
        )}

        {!modoReal && (
          <details className="atalho">
            <summary>Protótipo: entrar como um cliente de exemplo</summary>
            {negocios.map((n) => (
              <button
                key={n.id}
                className="botao botao--leve"
                onClick={() => {
                  entrar(n.id)
                  navigate('/inicio')
                }}
              >
                {n.nome}
              </button>
            ))}
          </details>
        )}
      </main>
    </div>
  )
}

// 2. Cadastro em 2 etapas
export function Cadastro() {
  const { cadastrar, modoReal, usuario, sessao } = useStore()
  const navigate = useNavigate()
  const [etapa, setEtapa] = useState(1)
  const [f, setF] = useState({ responsavel: '', nome: '', tipo: '', instagram: '', whatsapp: '', site: '', facebook: '', cidade: '', email: '' })
  const [incomodos, setIncomodos] = useState<string[]>([])
  const [aceite, setAceite] = useState(false)
  const campo = (k: keyof typeof f) => ({ value: f[k], onChange: (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value }) })

  if (modoReal && !usuario) return <Navigate to="/" />
  if (sessao) return <Navigate to="/inicio" />

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (etapa === 1) return setEtapa(2)
    cadastrar({ ...f, instagram: f.instagram.replace('@', ''), incomodos })
    navigate('/seguranca?primeira=1')
  }

  return (
    <TelaCliente titulo={`Cadastro · ${etapa} de 2`} voltar={etapa === 1 ? '/' : undefined} semMenu>
      <div className="progresso">
        <span style={{ width: etapa === 1 ? '50%' : '100%' }} />
      </div>
      <form onSubmit={enviar} className="formulario">
        {etapa === 1 ? (
          <>
            <h2>Conte sobre o seu negócio</h2>
            <label>
              Seu nome
              <input required {...campo('responsavel')} />
            </label>
            <label>
              Nome do negócio
              <input required {...campo('nome')} />
            </label>
            <label>
              Tipo
              <select required {...campo('tipo')}>
                <option value="">Escolha</option>
                {TIPOS_NEGOCIO.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              @ do Instagram
              <input required placeholder="@seunegocio" {...campo('instagram')} />
            </label>
            <label>
              WhatsApp
              <input required inputMode="tel" placeholder="(61) 90000-0000" {...campo('whatsapp')} />
            </label>
            <label>
              Site ou página do Facebook <span className="opcional">(opcional)</span>
              <input {...campo('site')} />
            </label>
            <Dica titulo="Fique tranquilo">Analisamos seu perfil de fora, como um cliente veria. Não pedimos senha nem acesso às suas contas.</Dica>
            <button className="botao">Continuar</button>
          </>
        ) : (
          <>
            <h2>Quase lá</h2>
            <label>
              Cidade
              <input required placeholder="Ex.: Taguatinga (DF)" {...campo('cidade')} />
            </label>
            <fieldset>
              <legend>O que mais te incomoda hoje?</legend>
              {INCOMODOS.map((i) => (
                <label key={i} className={'opcao' + (incomodos.includes(i) ? ' marcada' : '')}>
                  <input
                    type="checkbox"
                    checked={incomodos.includes(i)}
                    onChange={(e) => setIncomodos(e.target.checked ? [...incomodos, i] : incomodos.filter((x) => x !== i))}
                  />
                  {i}
                </label>
              ))}
            </fieldset>
            <label className="aceite">
              <input type="checkbox" required checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
              <span>
                Li e aceito os <a href="#">termos de uso</a> e a <a href="#">política de privacidade</a>. Usamos seus dados só para o diagnóstico e o atendimento.
              </span>
            </label>
            <button className="botao">Pedir meu diagnóstico grátis</button>
            <button type="button" className="botao botao--leve" onClick={() => setEtapa(1)}>
              Voltar
            </button>
          </>
        )}
      </form>
    </TelaCliente>
  )
}

// 3. Checklist de segurança (7º ponto)
export function Seguranca() {
  const { negocio, loja } = useCliente()
  const [params] = useSearchParams()
  const primeira = params.get('primeira')
  const [aberto, setAberto] = useState<string | null>(null)
  if (!negocio) return <Navigate to="/" />
  const nota = notaSeguranca(negocio.checklist)

  return (
    <TelaCliente titulo="Segurança da conta">
      {primeira && <p className="selo-ok">✅ Pedido recebido! Enquanto analisamos seu perfil, faça este checklist rápido.</p>}
      <div className="linha-nota">
        <NotaAnel nota={nota} tamanho={90} />
        <p>Esta é a nota de segurança da sua conta. Ela não aparece de fora do perfil, por isso só você pode responder.</p>
      </div>
      <ul className="checklist">
        {CHECKLIST.map((c) => {
          const feito = !!negocio.checklist[c.id]
          return (
            <li key={c.id} className={feito ? 'feito' : ''}>
              <label>
                <input type="checkbox" checked={feito} onChange={(e) => loja.marcarItem(negocio.id, c.id, e.target.checked)} />
                <span>{c.texto}</span>
              </label>
              {!feito && (
                <button className="link" onClick={() => setAberto(aberto === c.id ? null : c.id)}>
                  {aberto === c.id ? 'Fechar' : 'Como resolver?'}
                </button>
              )}
              {!feito && aberto === c.id && <p className="checklist__dica">{c.dica}</p>}
            </li>
          )
        })}
      </ul>
      {primeira && (
        <Link to="/status" className="botao">
          Ver o andamento do diagnóstico
        </Link>
      )}
    </TelaCliente>
  )
}

// 4. Status do diagnóstico
export function Status() {
  const { negocio, diagnostico } = useCliente()
  if (!negocio || !diagnostico) return <Navigate to="/" />
  const ordem = ['recebido', 'analise', 'pronto'] as const
  const atual = ordem.indexOf(diagnostico.status)
  const etapas = [
    ['Recebido', `Pedido feito em ${formatarData(diagnostico.pedidoEm)}.`],
    ['Em análise', 'Nossa IA está analisando seu perfil e o Vitor revisa cada ponto.'],
    ['Pronto', 'Você recebe um aviso e já pode ver o resultado.'],
  ]
  return (
    <TelaCliente titulo="Seu diagnóstico">
      <ol className="etapas">
        {etapas.map(([nome, texto], i) => (
          <li key={nome} className={i < atual ? 'passou' : i === atual ? 'agora' : ''}>
            <strong>{nome}</strong>
            <p>{texto}</p>
          </li>
        ))}
      </ol>
      {diagnostico.status === 'pronto' ? (
        <Link to="/resultado" className="botao">
          Ver meu resultado
        </Link>
      ) : (
        <Dica titulo="Enquanto isso">Normalmente fica pronto em até 2 dias. Aproveite para conferir a segurança da sua conta.</Dica>
      )}
    </TelaCliente>
  )
}

// 5. Resultado do diagnóstico
export function Resultado() {
  const { negocio, diagnostico } = useCliente()
  const [aberto, setAberto] = useState<string | null>(null)
  if (!negocio || !diagnostico) return <Navigate to="/" />
  if (diagnostico.status !== 'pronto') return <Navigate to="/status" />
  const geral = notaGeral(diagnostico.pontos)
  const plano = PLANOS[diagnostico.plano]
  const zap = 'https://wa.me/5561992163078?text=' + encodeURIComponent(`Oi, Vitor! Vi o diagnóstico da ${negocio.nome} no app.`)

  return (
    <TelaCliente titulo="Resultado">
      <section className="destaque-nota">
        <NotaAnel nota={geral} tamanho={140} legenda="nota geral do perfil" />
        <p>{diagnostico.resumo}</p>
        <span className="miudo">Publicado em {formatarData(diagnostico.publicadoEm!)} · revisado pelo Vitor</span>
      </section>

      <h2>Os 7 pontos</h2>
      <ul className="pontos">
        {diagnostico.pontos.map((p) => {
          const def = PONTOS.find((x) => x.id === p.id)!
          return (
            <li key={p.id}>
              <button className="ponto" onClick={() => setAberto(aberto === p.id ? null : p.id)}>
                <span className="ponto__titulo">{def.titulo}</span>
                <BarraNota nota={p.nota} />
                <strong>{formatarNota(p.nota)}</strong>
              </button>
              {aberto === p.id && (
                <div className="ponto__corpo">
                  <p>{p.comentario}</p>
                  {p.prints.length > 0 && (
                    <div className="prints">
                      {p.prints.map((pr) => (
                        <figure key={pr} className="print">
                          <span>📷</span>
                          <figcaption>{pr}</figcaption>
                        </figure>
                      ))}
                    </div>
                  )}
                  <Dica>{def.dica}</Dica>
                </div>
              )}
            </li>
          )
        })}
        <li>
          <Link to="/seguranca" className="ponto">
            <span className="ponto__titulo">Segurança da conta</span>
            <BarraNota nota={notaSeguranca(negocio.checklist)} />
            <strong>{formatarNota(notaSeguranca(negocio.checklist))}</strong>
          </Link>
        </li>
      </ul>
      <p className="miudo">A nota geral é a média dos 6 pontos que qualquer cliente vê de fora. A segurança fica à parte, porque só você responde.</p>

      <section className="cartao plano">
        <span className="etiqueta">Recomendado para você</span>
        <h2>{plano.nome}</h2>
        <p>{plano.resumo}</p>
        <ul>
          {plano.itens.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
        <p className="preco">
          {plano.preco} · <strong>15 dias grátis</strong>
        </p>
        <Link to="/conexao" className="botao">
          Quero contratar
        </Link>
        <a href={zap} target="_blank" rel="noreferrer" className="botao botao--contorno">
          Falar com o Vitor
        </a>
      </section>
    </TelaCliente>
  )
}

// 6. Conexão: o Studio pede o acesso parcial e o cliente só aprova.
// O ID de parceiro fica como plano B, para quem não receber o pedido.
export function Conexao() {
  const { negocio, loja } = useCliente()
  const [copiado, setCopiado] = useState(false)
  if (!negocio) return <Navigate to="/" />
  const etapas = ['Você autoriza', 'O Studio pede', 'Você aprova', 'Conectado']
  const atual = { pendente: 0, solicitado: 1, pedido: 2, aguardando: 3, conectado: 4 }[negocio.conexao]

  return (
    <TelaCliente titulo="Conectar ao Studio">
      <ol className="trilha">
        {etapas.map((e, i) => (
          <li key={e} className={i < atual ? 'passou' : i === atual ? 'agora' : ''}>
            <span>{i < atual ? '✓' : i + 1}</span>
            {e}
          </li>
        ))}
      </ol>

      {negocio.conexao === 'pendente' && (
        <>
          <h2>Você não precisa mexer em configuração nenhuma</h2>
          <p>
            Nós mandamos um <b>pedido de acesso</b> para a sua página e o seu Instagram (@{negocio.instagram}). Você só toca em <b>Aprovar</b> no Facebook ou no
            Business Suite.
          </p>
          <Dica titulo="Por que pedir acesso">Com acesso parcial, publicamos e respondemos seus clientes sem nunca saber a sua senha. A página continua sendo só sua.</Dica>
          <button className="botao" onClick={() => loja.solicitarConexao(negocio.id)}>
            Pode mandar o pedido
          </button>
        </>
      )}

      {negocio.conexao === 'solicitado' && (
        <p className="selo-espera">⏳ Combinado! O Vitor vai mandar o pedido de acesso e você recebe um aviso aqui quando ele chegar.</p>
      )}

      {negocio.conexao === 'pedido' && (
        <>
          <h2>O pedido chegou. Falta só aprovar.</h2>
          <p>Abra o app do Facebook ou do Business Suite. O pedido deve aparecer mais ou menos assim:</p>
          <div className="pedido-mock" aria-label="Exemplo de pedido de acesso">
            <div className="pedido-mock__topo">
              <span className="pedido-mock__avatar">VC</span>
              <div>
                <strong>Studio Vitor Campos</strong> quer acessar a sua página
                <span className="miudo"> {negocio.nome}</span>
              </div>
            </div>
            <p className="pedido-mock__nivel">Acesso parcial · publicar, stories e responder mensagens</p>
            <div className="pedido-mock__botoes">
              <span className="sim">Aprovar</span>
              <span>Recusar</span>
            </div>
          </div>
          <p className="miudo">Ilustração. A tela real da Meta pode ser um pouco diferente.</p>

          <h3 className="confira">Antes de aprovar, confira:</h3>
          <ul className="confira__lista">
            <li>
              O nome é <b>Studio Vitor Campos</b>.
            </li>
            <li>
              O nível é <b>Acesso parcial</b>, nunca Controle total.
            </li>
            <li>Ninguém pediu sua senha nem código para isso.</li>
          </ul>

          <button className="botao" onClick={() => loja.pedirConexao(negocio.id)}>
            Já aprovei
          </button>
        </>
      )}

      {negocio.conexao === 'aguardando' && <p className="selo-espera">⏳ Obrigado! O Vitor está conferindo o acesso e confirma em breve.</p>}
      {negocio.conexao === 'conectado' && <p className="selo-ok">✅ Conectado! A automação entra no ar nos próximos dias.</p>}

      {(negocio.conexao === 'aguardando' || negocio.conexao === 'conectado') && (
        <Link to="/marca" className="botao">
          Próximo: enviar sua marca
        </Link>
      )}

      <aside className="dica-banco">
        <strong>🛡️ Dica de segurança</strong>
        <p>
          <b>Sua página é sua.</b> Nunca dê controle total a ninguém, nem a nós.
        </p>
        <p>O controle total permite adicionar e remover pessoas da sua conta. Esse poder deve ser só seu.</p>
        <p>
          Para o Studio, basta <b>Acesso parcial</b>: é o suficiente para publicarmos e respondermos seus clientes.
        </p>
        <p>E lembre: nunca pedimos sua senha nem códigos de verificação.</p>
      </aside>

      {(negocio.conexao === 'solicitado' || negocio.conexao === 'pedido') && (
        <details className="plano-b">
          <summary>O pedido não chegou?</summary>
          <p>Você também pode adicionar o Studio como parceiro. No Business Suite: Configurações › Parceiros › Adicionar parceiro, e cole este ID:</p>
          <div className="id-parceiro">
            <span>ID de parceiro do Studio</span>
            <strong>{ID_PARCEIRO}</strong>
            <button
              className="botao botao--pequeno botao--contorno"
              onClick={() => {
                navigator.clipboard?.writeText(ID_PARCEIRO.replace(/\s/g, ''))
                setCopiado(true)
              }}
            >
              {copiado ? '✓ Copiado' : 'Copiar ID'}
            </button>
          </div>
          <p>
            Marque <b>Acesso parcial</b> e deixe Controle total e Anúncios desligados. Se travar, toque em Falar com o Vitor e a gente faz junto com você.
          </p>
        </details>
      )}

      <ContaSegura />
    </TelaCliente>
  )
}

// 7. Identidade e dados do negócio
export function Marca() {
  const { negocio, loja } = useCliente()
  const [salvo, setSalvo] = useState(false)
  if (!negocio) return <Navigate to="/" />
  const d = negocio.dados
  const campo = (k: keyof typeof d) => ({
    value: d[k],
    onChange: (e: { target: { value: string } }) => {
      setSalvo(false)
      loja.mudarNegocio(negocio.id, { dados: { ...d, [k]: e.target.value } })
    },
  })

  return (
    <TelaCliente titulo="Sua marca">
      <h2>Logo, fotos e peças antigas</h2>
      <p className="sub">Mande o que você tiver: logo em PNG, JPEG ou PDF, fotos dos produtos, posts antigos. Não precisa ter manual de marca.</p>
      <label className="upload">
        <input
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={(e) => {
            const nomes = Array.from(e.target.files ?? []).map((f) => f.name)
            loja.mudarNegocio(negocio.id, { materiais: [...negocio.materiais, ...nomes] })
          }}
        />
        <span>＋ Escolher arquivos</span>
      </label>
      {negocio.materiais.length > 0 && (
        <ul className="arquivos">
          {negocio.materiais.map((m) => (
            <li key={m}>📎 {m}</li>
          ))}
        </ul>
      )}
      <Dica>Usamos o material que você já tem e ajustamos o básico (recorte, fundo, cores a partir do logo). Assim as peças saem com a sua cara desde a primeira semana.</Dica>

      <h2>Dados do negócio</h2>
      <p className="sub">São as respostas que a automação vai dar aos seus clientes.</p>
      <form
        className="formulario"
        onSubmit={(e) => {
          e.preventDefault()
          setSalvo(true)
        }}
      >
        <label>
          Horário de funcionamento
          <input placeholder="Ex.: Ter a dom, 18h às 23h" {...campo('horario')} />
        </label>
        <label>
          Endereço (ou endereços)
          <input {...campo('endereco')} />
        </label>
        <label>
          Link do cardápio ou delivery
          <input placeholder="Ex.: iFood, cardápio digital, Linktree" {...campo('cardapio')} />
        </label>
        <label>
          Perguntas que mais chegam
          <textarea rows={3} placeholder="Ex.: Qual a taxa de entrega? Tem opção sem lactose?" {...campo('perguntas')} />
        </label>
        <label>
          WhatsApp de cada unidade
          <input {...campo('whatsapps')} />
        </label>
        <button className="botao">{salvo ? '✓ Salvo' : 'Salvar'}</button>
      </form>
    </TelaCliente>
  )
}

// 8. Evolução: antes × agora
export function Evolucao() {
  const { negocio, diagnostico } = useCliente()
  if (!negocio || !diagnostico) return <Navigate to="/" />
  if (diagnostico.status !== 'pronto')
    return (
      <TelaCliente titulo="Evolução">
        <Dica titulo="Em breve">Assim que o diagnóstico ficar pronto, a nota dele vira o seu ponto de partida aqui.</Dica>
      </TelaCliente>
    )
  const antes = notaGeral(diagnostico.pontos)
  const ultima = negocio.reavaliacoes.at(-1)
  const agora = ultima ? Object.values(ultima.notas).reduce((a, b) => a + b, 0) / Object.values(ultima.notas).length : null

  return (
    <TelaCliente titulo="Evolução">
      <section className="antes-agora">
        <NotaAnel nota={antes} tamanho={100} legenda={`antes · ${formatarData(diagnostico.publicadoEm!)}`} />
        <span className="seta">→</span>
        <NotaAnel nota={agora} tamanho={100} legenda={ultima ? `agora · ${formatarData(ultima.data)}` : 'próxima avaliação'} />
      </section>
      {agora !== null && antes !== null && (
        <p className="selo-ok">
          Sua nota subiu {formatarNota(agora - antes)} pontos desde o diagnóstico. 🎉
        </p>
      )}
      <ul className="comparacao">
        {diagnostico.pontos.map((p) => {
          const novo = ultima?.notas[p.id] ?? null
          return (
            <li key={p.id}>
              <span>{PONTOS.find((x) => x.id === p.id)!.titulo}</span>
              <div>
                <BarraNota nota={p.nota} />
                <BarraNota nota={novo} />
              </div>
              <strong>
                {formatarNota(p.nota)} → {formatarNota(novo)}
              </strong>
            </li>
          )
        })}
      </ul>
      <p className="miudo">Barra de cima: diagnóstico. Barra de baixo: última avaliação. O Vitor reavalia seu perfil a cada 3 meses.</p>
    </TelaCliente>
  )
}

// 9. Início: linha do tempo dos 15 dias
export function Inicio() {
  const { negocio, diagnostico } = useCliente()
  if (!negocio || !diagnostico) return <Navigate to="/" />
  const dia = diaDaJornada(negocio.inicioJornada)

  const proximo =
    diagnostico.status !== 'pronto'
      ? { texto: 'Acompanhe seu diagnóstico', para: '/status' }
      : negocio.conexao === 'pendente'
        ? { texto: 'Conecte sua página ao Studio', para: '/conexao' }
        : negocio.conexao === 'pedido'
          ? { texto: 'Aprove o pedido do Studio', para: '/conexao' }
          : negocio.materiais.length === 0
          ? { texto: 'Envie seu logo e fotos', para: '/marca' }
          : null

  return (
    <TelaCliente>
      <h1 className="ola">Olá, {negocio.responsavel.split(' ')[0]}!</h1>
      <p className="sub">{negocio.nome}</p>

      {proximo && (
        <Link to={proximo.para} className="proximo">
          <span>Próximo passo</span>
          <strong>{proximo.texto} →</strong>
        </Link>
      )}

      {dia !== null ? (
        <>
          <div className="contador">
            <strong>Dia {Math.min(dia, 15)}</strong> de 15 grátis
            <div className="progresso">
              <span style={{ width: `${(Math.min(dia, 15) / 15) * 100}%` }} />
            </div>
          </div>
          <ol className="linha-tempo">
            {VITORIAS.map((v) => {
              const liberada = negocio.vitorias.includes(v.id)
              return (
                <li key={v.id} className={liberada ? 'liberada' : ''}>
                  <span className="linha-tempo__dia">Dia {v.dia}</span>
                  <div>
                    <strong>{v.titulo}</strong>
                    <p>{liberada ? v.texto : 'Em breve'}</p>
                    {liberada && v.id === 'espelho' && <Link to="/resultado">Ver diagnóstico</Link>}
                  </div>
                </li>
              )
            })}
          </ol>
        </>
      ) : (
        <Dica titulo="Como funciona">Quando seu diagnóstico ficar pronto, começam seus 15 dias grátis. Cada conquista aparece aqui e chega como aviso no seu celular.</Dica>
      )}
    </TelaCliente>
  )
}

export function Avisos() {
  const { negocio, notificacoes, loja } = useCliente()
  if (!negocio) return <Navigate to="/" />
  return (
    <TelaCliente titulo="Avisos" voltar="/inicio">
      {notificacoes.length === 0 && <p className="sub">Nenhum aviso ainda.</p>}
      <ul className="avisos">
        {notificacoes.map((n) => (
          <li key={n.id} className={n.lida ? '' : 'nova'}>
            <strong>{n.titulo}</strong>
            <p>{n.texto}</p>
            <span className="miudo">{formatarData(n.data)}</span>
          </li>
        ))}
      </ul>
      {notificacoes.some((n) => !n.lida) && (
        <button className="botao botao--leve" onClick={() => loja.marcarLidas(negocio.id)}>
          Marcar tudo como lido
        </button>
      )}
      <button
        className="botao botao--leve"
        onClick={() => {
          loja.entrar(null)
        }}
      >
        Sair
      </button>
    </TelaCliente>
  )
}
