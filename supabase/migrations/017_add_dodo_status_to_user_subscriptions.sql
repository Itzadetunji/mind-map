alter table public.user_subscriptions
add column if not exists dodo_status text not null default 'failed';
