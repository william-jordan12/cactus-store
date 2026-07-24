const mysql = require('mysql2/promise');

async function main() {
  const url = process.argv[2];
  if (!url) { console.log('Usage: node test-db.cjs <DATABASE_URL>'); return; }
  
  try {
    const conn = await mysql.createConnection({
      uri: url,
      ssl: { rejectUnauthorized: false }
    });
    const [r] = await conn.query('SELECT 1 as ok');
    console.log('Connected OK:', JSON.stringify(r));
    await conn.end();
  } catch(e) {
    console.error('Connection FAILED:', e.message);
  }
}

main();
