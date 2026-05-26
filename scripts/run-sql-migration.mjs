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

const file = process.argv[2];
if (!file) {
  console.error("Kullanım: node scripts/run-sql-migration.mjs <sql-dosya>");
  process.exit(1);
}

const connectionString =
  process.env.DIRECT_URL?.trim() ||
  process.env.POSTGRES_URL_NON_POOLING?.trim() ||
  process.env.DATABASE_URL?.trim();

if (!connectionString) {
  console.error("DIRECT_URL tanımlı değil (.env.local)");
  process.exit(1);
}

const isLocal =
  connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
const pgConnectionString = isLocal
  ? connectionString
  : connectionString.replace(/([?&])sslmode=[^&]*&?/g, "$1").replace(/[?&]$/, "");

const client = new pg.Client({
  connectionString: pgConnectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

const sql = fs.readFileSync(file, "utf8");

try {
  await client.connect();
  await client.query(sql);
  console.log(`Migration OK: ${file}`);
} catch (error) {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await client.end();
}
