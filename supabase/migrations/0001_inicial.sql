-- Agência num App — etapa 2: banco inicial (Fase 1, "humano como API")
-- Rodar uma vez no SQL Editor do Supabase.
-- Regras: nenhum campo guarda senha, código ou token das redes do cliente.
-- Cada cliente só enxerga o próprio negócio (RLS); o gestor (Vitor) vê e edita tudo.

-- ---------------------------------------------------------------------------
-- Perfis: um por usuário do Auth. Papel 'gestor' para os e-mails do Vitor.
-- ---------------------------------------------------------------------------
create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  papel text not null default 'cliente' check (papel in ('cliente', 'gestor')),
  criado_em timestamptz not null default now()
);

create or replace function public.eh_gestor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.perfis where id = auth.uid() and papel = 'gestor');
$$;

create or replace function public.novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, email, papel)
  values (
    new.id,
    new.email,
    case when lower(new.email) in ('vitorcamposdg@gmail.com', 'ia.vitormkt@gmail.com') then 'gestor' else 'cliente' end
  );
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.novo_usuario();

-- ---------------------------------------------------------------------------
-- Negócios (um por cliente na Fase 1)
-- ---------------------------------------------------------------------------
create table public.negocios (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null,
  responsavel text not null default '',
  email text not null default '',
  tipo text not null default '',
  cidade text not null default '',
  instagram text not null default '',
  facebook text not null default '',
  site text not null default '',
  whatsapp text not null default '',
  incomodos text[] not null default '{}',
  checklist jsonb not null default '{}',
  conexao text not null default 'pendente'
    check (conexao in ('pendente', 'solicitado', 'pedido', 'aguardando', 'conectado')),
  inicio_jornada timestamptz,
  vitorias text[] not null default '{}',
  materiais text[] not null default '{}',
  dados jsonb not null default '{"horario":"","endereco":"","cardapio":"","perguntas":"","whatsapps":""}',
  reavaliacoes jsonb not null default '[]',
  criado_em timestamptz not null default now()
);
create index on public.negocios (dono);

-- O cliente edita os próprios dados, mas o que é do gestor fica protegido:
-- jornada, vitórias, reavaliações, materiais e a confirmação da conexão.
create or replace function public.proteger_negocio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.eh_gestor() then
    return new;
  end if;
  new.dono := old.dono;
  new.inicio_jornada := old.inicio_jornada;
  new.vitorias := old.vitorias;
  new.reavaliacoes := old.reavaliacoes;
  new.materiais := old.materiais;
  -- cliente só avança a conexão nos passos dele: pendente → solicitado, pedido → aguardando
  if new.conexao is distinct from old.conexao
     and not ((old.conexao = 'pendente' and new.conexao = 'solicitado')
           or (old.conexao = 'pedido' and new.conexao = 'aguardando')) then
    new.conexao := old.conexao;
  end if;
  return new;
end;
$$;

create trigger proteger_negocio
  before update on public.negocios
  for each row execute function public.proteger_negocio();

-- ---------------------------------------------------------------------------
-- Diagnósticos (pontos com nota, comentário e prints ficam em jsonb)
-- ---------------------------------------------------------------------------
create table public.diagnosticos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  status text not null default 'recebido' check (status in ('recebido', 'analise', 'pronto')),
  pedido_em timestamptz not null default now(),
  publicado_em timestamptz,
  pontos jsonb not null default '[]',
  resumo text not null default '',
  plano text not null default 'automacao' check (plano in ('automacao', 'gestao')),
  observacoes text not null default ''
);
create index on public.diagnosticos (negocio_id);

-- ---------------------------------------------------------------------------
-- Notificações
-- ---------------------------------------------------------------------------
create table public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  data timestamptz not null default now(),
  titulo text not null,
  texto text not null default '',
  lida boolean not null default false
);
create index on public.notificacoes (negocio_id, data desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.perfis enable row level security;
alter table public.negocios enable row level security;
alter table public.diagnosticos enable row level security;
alter table public.notificacoes enable row level security;

create policy "perfil: ver o próprio ou gestor" on public.perfis
  for select using (id = auth.uid() or public.eh_gestor());

-- Negócios: cliente vê/cria/edita o seu; gestor tudo.
create policy "negocios: ver" on public.negocios
  for select using (dono = auth.uid() or public.eh_gestor());
create policy "negocios: criar o próprio" on public.negocios
  for insert with check (dono = auth.uid());
create policy "negocios: editar" on public.negocios
  for update using (dono = auth.uid() or public.eh_gestor());
create policy "negocios: gestor apaga" on public.negocios
  for delete using (public.eh_gestor());

-- Diagnósticos: cliente lê o seu e cria o pedido; só o gestor edita.
create policy "diagnosticos: ver" on public.diagnosticos
  for select using (
    public.eh_gestor()
    or exists (select 1 from public.negocios n where n.id = negocio_id and n.dono = auth.uid())
  );
create policy "diagnosticos: cliente pede" on public.diagnosticos
  for insert with check (
    public.eh_gestor()
    or exists (select 1 from public.negocios n where n.id = negocio_id and n.dono = auth.uid())
  );
create policy "diagnosticos: gestor edita" on public.diagnosticos
  for update using (public.eh_gestor());

-- Notificações: cliente lê e marca como lida as suas; gestor cria.
create policy "notificacoes: ver" on public.notificacoes
  for select using (
    public.eh_gestor()
    or exists (select 1 from public.negocios n where n.id = negocio_id and n.dono = auth.uid())
  );
create policy "notificacoes: gestor cria" on public.notificacoes
  for insert with check (public.eh_gestor());
create policy "notificacoes: marcar lida" on public.notificacoes
  for update using (
    public.eh_gestor()
    or exists (select 1 from public.negocios n where n.id = negocio_id and n.dono = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Arquivos: prints do diagnóstico e materiais da marca (privados)
-- Caminho: <negocio_id>/<arquivo>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('arquivos', 'arquivos', false);

create policy "arquivos: ver" on storage.objects
  for select using (
    bucket_id = 'arquivos' and (
      public.eh_gestor()
      or exists (
        select 1 from public.negocios n
        where n.id::text = (storage.foldername(name))[1] and n.dono = auth.uid()
      )
    )
  );
create policy "arquivos: enviar" on storage.objects
  for insert with check (
    bucket_id = 'arquivos' and (
      public.eh_gestor()
      or exists (
        select 1 from public.negocios n
        where n.id::text = (storage.foldername(name))[1] and n.dono = auth.uid()
      )
    )
  );
create policy "arquivos: gestor apaga" on storage.objects
  for delete using (bucket_id = 'arquivos' and public.eh_gestor());
