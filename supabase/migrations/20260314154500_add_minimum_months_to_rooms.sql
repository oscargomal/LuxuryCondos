alter table rooms
add column if not exists minimum_months integer default 0;
