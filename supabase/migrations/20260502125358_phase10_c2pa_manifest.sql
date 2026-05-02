-- 1. 拡張とカラム定義
create extension if not exists pgcrypto;
set search_path = public;

alter table public.certificates add column if not exists c2pa_manifest jsonb;

-- 2. 10KBの物理的サイズ制限（コスト爆発・メモリパンクの防衛）
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'certificates_c2pa_manifest_size_chk') then
    alter table public.certificates add constraint certificates_c2pa_manifest_size_chk
      check (c2pa_manifest is null or octet_length(convert_to(c2pa_manifest::text, 'utf8')) <= 10240);
  end if;
end $$;

comment on column public.certificates.c2pa_manifest is 'Scrubbed Content Credentials payload. Max 10KB, no binary thumbnails, write-once.';

-- 3. 完璧なWORMトリガー（不変性とタイムスタンプ順序の強制）
create or replace function public.fn_certificates_c2pa_worm() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    -- Rule A: 一度書き込まれたC2PAは二度と変更できない
    if old.c2pa_manifest is not null and new.c2pa_manifest is distinct from old.c2pa_manifest then
      raise exception 'c2pa_manifest is write-once' using errcode = 'P0001';
    end if;
    -- Rule B: タイムスタンプ発行済の証明書に、後からC2PAを追加することは許さない
    if old.timestamp_token is not null and old.c2pa_manifest is null and new.c2pa_manifest is not null then
      raise exception 'c2pa_manifest cannot be set after timestamp issuance' using errcode = 'P0002';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_certificates_c2pa_worm on public.certificates;
create trigger trg_certificates_c2pa_worm before update on public.certificates for each row execute function public.fn_certificates_c2pa_worm();

-- 4. 検索インデックス
create index if not exists certificates_c2pa_present_idx on public.certificates (id) where c2pa_manifest is not null;
create index if not exists certificates_c2pa_ai_used_idx on public.certificates ((coalesce(c2pa_manifest->>'ai_used', 'null'))) where c2pa_manifest is not null;

-- 5. Storefront用RPC（Egress爆発地雷の除去）
DROP FUNCTION IF EXISTS public.fn_storefront_certificates(text, integer, uuid);

create or replace function public.fn_storefront_certificates(
  p_username text, p_limit integer default 60, p_project_id uuid default null
)
returns table (
  id uuid, title text, proven_at timestamptz, certified_at timestamptz, sha256 text, tsa_provider text, has_timestamp boolean, proof_mode text, visibility text, public_image_url text, delivery_status text, project_id uuid, badge_tier text,
  c2pa_present boolean, c2pa_valid boolean, c2pa_ai_used boolean, c2pa_ai_provider text, c2pa_issuer text
)
language sql stable security definer set search_path = public as $$
  with target as (
    select id from public.profiles where lower(username) = lower(p_username) and coalesce(is_storefront_public, true) is true limit 1
  )
  select c.id, coalesce(c.title, c.original_filename, c.file_name, 'Untitled') as title, c.proven_at, c.certified_at, c.sha256, c.tsa_provider, (c.timestamp_token is not null and c.certified_at is not null) as has_timestamp, c.proof_mode, c.visibility, case when c.visibility = 'public' then c.public_image_url else null end as public_image_url, c.delivery_status, c.project_id, c.badge_tier,
         (c.c2pa_manifest is not null) as c2pa_present,
         case when c.c2pa_manifest is null then null when c.c2pa_manifest->>'validity' = 'valid' then true when c.c2pa_manifest->>'validity' = 'invalid' then false else null end as c2pa_valid,
         case when c.c2pa_manifest is null then null when c.c2pa_manifest ? 'ai_used' then (c.c2pa_manifest->>'ai_used')::boolean else null end as c2pa_ai_used,
         nullif(c.c2pa_manifest->>'ai_provider', '') as c2pa_ai_provider,
         nullif(c.c2pa_manifest->>'issuer', '') as c2pa_issuer
    from public.certificates c
    join target t on t.id = c.user_id
   where coalesce(c.visibility, 'public') = 'public' and coalesce(c.is_archived, false) = false and (p_project_id is null or c.project_id = p_project_id)
   order by coalesce(c.proven_at, c.created_at) desc
   limit greatest(1, least(120, p_limit));
$$;

revoke all on function public.fn_storefront_certificates(text, integer, uuid) from public;
grant execute on function public.fn_storefront_certificates(text, integer, uuid) to anon, authenticated, service_role;