-- 有料ニュースレター配信システム 初期スキーマ
create extension if not exists pgcrypto;

create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  applied_at date not null default current_date,        -- 申込日
  product_name text not null default '',                 -- 商品名
  payment_method text not null default '',                -- 決済方法
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed','refunded')), -- 決済状況
  terms_agreed boolean not null default false,             -- 利用規約への同意
  privacy_agreed boolean not null default false,           -- プライバシーポリシーへの同意
  contract_start_date date,                                -- 契約開始日
  contract_end_date date,                                  -- 契約終了日（開始日+1年-1日）
  -- lifecycle: 管理者が明示的に操作する状態のみを保持する。
  -- 「有効/期限間近/期限切れ」は保存せず、常に日付からその場で計算する（member_viewを参照）。
  lifecycle text not null default 'pending'
    check (lifecycle in ('pending','active','paused','cancelled')),
  renewal_count int not null default 0,                    -- 更新回数
  unsubscribed boolean not null default false,              -- 配信停止フラグ
  unsubscribe_token uuid not null default gen_random_uuid(),-- 配信停止リンク用トークン
  last_sent_at timestamptz,                                 -- 最終送信日時
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index members_contract_end_date_idx on members (contract_end_date);
create unique index members_unsubscribe_token_idx on members (unsubscribe_token);

-- 契約履歴（初回契約・更新のたびに1行追加）
create table subscription_history (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  renewal_number int not null default 0,                    -- 0=初回, 1=1回目の更新...
  source text not null default 'initial'
    check (source in ('initial','manual','stripe','auto')),
  created_at timestamptz not null default now()
);

create index subscription_history_member_id_idx on subscription_history (member_id);

-- ニュースレター（記事）
create table newsletters (
  id uuid primary key default gen_random_uuid(),
  title text not null,           -- 管理用タイトル
  subject text not null,         -- メール件名
  body_html text not null default '', -- 本文（HTML）
  publish_date date,             -- 公開日（表示用）
  scheduled_at timestamptz,      -- 送信予定日時（予約送信）
  status text not null default 'draft'
    check (status in ('draft','scheduled','sending','sent','failed')),
  total_recipients int not null default 0,
  success_count int not null default 0,
  failure_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz
);

create index newsletters_status_scheduled_idx on newsletters (status, scheduled_at);

-- 送信履歴（誰に・どのニュースレターを送ったか）
-- (newsletter_id, member_id) の一意制約が二重送信防止の要。
create table newsletter_sends (
  id uuid primary key default gen_random_uuid(),
  newsletter_id uuid not null references newsletters(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  status text not null check (status in ('success','failed')),
  error text,
  sent_at timestamptz not null default now(),
  unique (newsletter_id, member_id)
);

create index newsletter_sends_member_id_idx on newsletter_sends (member_id);

-- 会員の「今日時点の状態」をその場で計算するビュー。
-- バッチ更新のし忘れで状態がズレることがないよう、保存はせず毎回計算する。
create or replace view member_view as
select
  m.*,
  case
    when m.contract_end_date is null then null
    else (m.contract_end_date - current_date)
  end as days_remaining,
  case
    when m.unsubscribed or m.lifecycle = 'cancelled' then '解約'
    when m.lifecycle = 'paused' then '停止中'
    when m.lifecycle = 'pending' or m.contract_start_date is null then '未開始'
    when m.contract_end_date < current_date then '期限切れ'
    when m.contract_end_date - current_date <= 30 then '期限間近'
    else '有効'
  end as display_status,
  (
    m.payment_status = 'paid'
    and m.lifecycle = 'active'
    and not m.unsubscribed
    and m.contract_start_date is not null
    and m.contract_end_date is not null
    and m.contract_start_date <= current_date
    and m.contract_end_date >= current_date
  ) as is_deliverable
from members m;

-- このアプリはサーバー（Service Roleキー）経由でのみDBにアクセスし、
-- ブラウザから直接Supabaseを呼び出すことはしない。
-- そのためRLSを有効化した上で、匿名キー向けのポリシーは意図的に一切追加しない
-- （＝anonキーでは何も読み書きできない状態にする）。
alter table members enable row level security;
alter table subscription_history enable row level security;
alter table newsletters enable row level security;
alter table newsletter_sends enable row level security;
