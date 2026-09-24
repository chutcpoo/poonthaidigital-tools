import { neon } from '@neondatabase/serverless';

function json(res, status, body) {
  res.status(status).setHeader('cache-control', 'no-store').json(body);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { status: 'BLOCKED', error: 'METHOD_NOT_ALLOWED' });
  if (!process.env.DATABASE_URL) return json(res, 503, { status: 'BLOCKED', error: 'DATABASE_URL_MISSING' });

  try {
    const sql = neon(process.env.DATABASE_URL);
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
      tables,
      columns
    });
  } catch (error) {
    return json(res, 503, {
      status: 'BLOCKED',
      error: error instanceof Error ? error.message : 'SCHEMA_READ_FAILED'
    });
  }
}
