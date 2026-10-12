const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.warn('No .env file found at', envPath);
    return;
  }
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

async function main() {
  loadEnvFile();

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const user = process.env.DB_USERNAME || process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  if (!user || password === undefined || !database) {
    console.error(
      'Missing DB credentials. Set DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME in .env',
    );
    process.exit(1);
  }

  const client = new Client({ host, port, user, password, database });

  try {
    await client.connect();
    console.log('Connected to', database, 'on', host + ':' + port);

    await client.query('DROP TABLE IF EXISTS quest_step CASCADE');
    console.log('Dropped quest_step (if existed).');

    await client.query('DROP TABLE IF EXISTS quest CASCADE');
    console.log('Dropped quest (if existed).');

    console.log('Done. Restart Nest (npm run start:dev) so synchronize recreates tables.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
