-- Tek seferlik: tkuru@gmail.com admin hesabı
-- Supabase Dashboard → SQL Editor içinde çalıştırın.

create extension if not exists "pgcrypto";

do $$
declare
  tkuru_id uuid := 'a1000001-0001-4001-8001-000000000003';
  instance uuid := '00000000-0000-0000-0000-000000000000';
  tkuru_pwd text := crypt('tkuru123', gen_salt('bf'));
begin
  if not exists (select 1 from auth.users where email = 'tkuru@gmail.com') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token, is_super_admin
    ) values (
      instance, tkuru_id, 'authenticated', 'authenticated',
      'tkuru@gmail.com', tkuru_pwd, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Tarik Kuru"}'::jsonb,
      now(), now(), '', '', '', '', false
    );
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), tkuru_id,
      jsonb_build_object('sub', tkuru_id::text, 'email', 'tkuru@gmail.com'),
      'email', tkuru_id::text, now(), now(), now()
    );
  else
    update auth.users
    set encrypted_password = tkuru_pwd,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"full_name":"Tarik Kuru"}'::jsonb,
        updated_at = now()
    where email = 'tkuru@gmail.com';
  end if;
end $$;

insert into rent_profiles (id, email, full_name, rent_roles)
select u.id, u.email, 'Tarik Kuru', '{RENT_ADMIN}'::rent_app_role[]
from auth.users u
where u.email = 'tkuru@gmail.com'
on conflict (id) do update
set rent_roles = '{RENT_ADMIN}'::rent_app_role[],
    full_name = 'Tarik Kuru',
    email = excluded.email;

insert into rent_panel_users (full_name, email, role, active, last_active_at)
values ('Tarik Kuru', 'tkuru@gmail.com', 'admin', true, now())
on conflict (email) do update
set role = 'admin',
    active = true,
    full_name = excluded.full_name,
    last_active_at = now();
