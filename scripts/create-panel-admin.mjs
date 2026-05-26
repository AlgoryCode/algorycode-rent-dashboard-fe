import fs from "node:fs";
import pg from "pg";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;
  for (const line of fs.readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const email = process.argv[2]?.trim() || "tkuru@gmail.com";
const password = process.argv[3] || "tkuru123";
const fullName = process.argv[4]?.trim() || "Tarik Kuru";
const userId = process.argv[5]?.trim() || "a1000001-0001-4001-8001-000000000003";

const connectionString =
  process.env.DIRECT_URL?.trim() ||
  process.env.POSTGRES_URL_NON_POOLING?.trim() ||
  process.env.DATABASE_URL?.trim();

if (!connectionString) {
  console.error("DATABASE_URL veya DIRECT_URL tanımlı değil (.env.local)");
  process.exit(1);
}

const sql = `
create extension if not exists "pgcrypto";

do $$
declare
  target_id uuid := '${userId}'::uuid;
  instance uuid := '00000000-0000-0000-0000-000000000000';
  target_email text := '${email.replace(/'/g, "''")}';
  target_name text := '${fullName.replace(/'/g, "''")}';
  target_pwd text := crypt('${password.replace(/'/g, "''")}', gen_salt('bf'));
begin
  if not exists (select 1 from auth.users where email = target_email) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token, is_super_admin
    ) values (
      instance, target_id, 'authenticated', 'authenticated',
      target_email, target_pwd, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', target_name),
      now(), now(), '', '', '', '', false
    );
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), target_id,
      jsonb_build_object('sub', target_id::text, 'email', target_email),
      'email', target_id::text, now(), now(), now()
    );
  else
    update auth.users
    set encrypted_password = target_pwd,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', target_name),
        updated_at = now()
    where email = target_email;
  end if;
end $$;

insert into rent_profiles (id, email, full_name, rent_roles)
select u.id, u.email, '${fullName.replace(/'/g, "''")}', '{RENT_ADMIN}'::rent_app_role[]
from auth.users u
where u.email = '${email.replace(/'/g, "''")}'
on conflict (id) do update
set rent_roles = '{RENT_ADMIN}'::rent_app_role[],
    full_name = excluded.full_name,
    email = excluded.email;

insert into rent_panel_users (full_name, email, role, active, last_active_at)
values ('${fullName.replace(/'/g, "''")}', '${email.replace(/'/g, "''")}', 'admin', true, now())
on conflict (email) do update
set role = 'admin',
    active = true,
    full_name = excluded.full_name,
    last_active_at = now();
`;

const isLocal =
  connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
const pgConnectionString = isLocal
  ? connectionString
  : connectionString.replace(/([?&])sslmode=[^&]*&?/g, "$1").replace(/[?&]$/, "");
const client = new pg.Client({
  connectionString: pgConnectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log(`Admin hesabı hazır: ${email}`);
} catch (error) {
  console.error("Admin hesabı oluşturulamadı:", error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await client.end();
}
