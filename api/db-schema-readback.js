import { neon } from '@neondatabase/serverless';

function json(res, status, body) {
  res.status(status).setHeader('cache-control', 'no-store').json(body);
}

function dbEnvPresence() {
  const names = [
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_URL_NON_POOLING',
    'NEON_DATABASE_URL',
    'PGHOST',
    'PGDATABASE',
    'PGUSER'
  ];
  return Object.fromEntries(names.map((name) => [name, Boolean(process.env[name])]));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { status: 'BLOCKED', error: 'METHOD_NOT_ALLOWED' });

  const env = dbEnvPresence();
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL ||
    null;

  if (!databaseUrl) {
    return json(res, 503, {
      status: 'BLOCKED',
      error: 'DATABASE_CONNECTION_ENV_MISSING',
      vercelEnv: process.env.VERCEL_ENV || null,
      dbEnvPresence: env
    });
  }

  try {
    const sql = neon(databaseUrl);
    const tables = await sql`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const columns = await sql`
      SELECT table_schema, table_name, column_name, data_type, is_nullable, ordinal_position
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `;

    return json(res, 200, {
      status: 'PASS',
      mode: 'READ_ONLY_SCHEMA',
      vercelEnv: process.env.VERCEL_ENV || null,
      dbEnvPresence: env,
      tables,
      columns
    });
  } catch (error) {
    return json(res, 503, {
      status: 'BLOCKED',
      error: error instanceof Error ? error.message : 'SCHEMA_READ_FAILED',
      vercelEnv: process.env.VERCEL_ENV || null,
      dbEnvPresence: env
    });
  }
}
