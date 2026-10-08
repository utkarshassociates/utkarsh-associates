-- 0003 — common office phone + email, editable by superAdmin.
-- Run AFTER schema.sql (and 0002). Safe to re-run.
--
-- Single-row table (id is forced to 1). The public site reads it with the
-- anon key; only the service role (superAdmin server action) can write.

create table if not exists site_contact (
  id          smallint primary key default 1 check (id = 1),
  phone       text not null default '9876543210',
  email       text not null default 'abc@test.com',
  show_phone  boolean not null default true,
  show_email  boolean not null default true,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references admins(id)
);

alter table site_contact enable row level security;

drop policy if exists "public can read site contact" on site_contact;
create policy "public can read site contact"
  on site_contact for select using (true);

-- Default row: placeholder values, both shown.
insert into site_contact (id) values (1) on conflict (id) do nothing;
