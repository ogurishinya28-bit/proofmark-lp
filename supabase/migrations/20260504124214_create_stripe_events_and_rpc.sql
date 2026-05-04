-- 1. Stripeイベント記録用テーブル
create table if not exists public.stripe_events (
    id text primary key, -- StripeイベントID (UNIQUE制約)
    type text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLSでクライアントからのアクセスを物理遮断
alter table public.stripe_events enable row level security;

-- 2. 【100%安全なトランザクション関数】
-- イベント記録とユーザープラン更新を「同時」に行い、途中でコケたら全て無かったことにする
create or replace function public.handle_stripe_checkout(
    p_event_id text,
    p_event_type text,
    p_user_id uuid,
    p_plan_type text
) returns void language plpgsql security definer as $$
begin
    -- A: まずイベントIDを記録 (ここでUNIQUE制約違反＝過去に処理済みなら、即座に例外で終了)
    insert into public.stripe_events (id, type)
    values (p_event_id, p_event_type);

    -- B: ユーザーのプランを更新
    update public.profiles
    set plan_type = p_plan_type,
        updated_at = now()
    where id = p_user_id;

    -- PostgreSQLの関数は単一トランザクションなので、AとBが両方成功した場合のみコミットされる
end;
$$;