create table if not exists app_settings (
  id int primary key default 1,
  stripe_account_id text,
  updated_at timestamptz default now()
);

insert into app_settings (id) values (1)
on conflict (id) do nothing;
