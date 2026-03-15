create table if not exists app_settings (
  id int primary key default 1,
  stripe_account_id text,
  updated_at timestamptz default now()
);

insert into app_settings (id)
values (1)
on conflict (id) do nothing;

alter table app_settings
add column if not exists home_images jsonb not null default '[]'::jsonb;

update app_settings
set home_images = '[]'::jsonb
where home_images is null;
