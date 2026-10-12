const fs = require('node:fs/promises');
const path = require('node:path');
const { Client } = require('pg');

// Chay mot file SQL trong transaction de migration va seed co the tai lap.
async function chay() {
  const filePath = process.argv[2];
  if (!filePath) throw new Error('Su dung: node scripts/run-sql.js <duong-dan-file.sql>');

  const client = new Client();
  await client.connect();
  try {
    const noiDung = await fs.readFile(path.resolve(filePath), 'utf8');
    await client.query('BEGIN');
    await client.query(noiDung);
    await client.query('COMMIT');
    console.log(`Da chay ${filePath}`);
  } catch (loi) {
    await client.query('ROLLBACK');
    throw loi;
  } finally {
    await client.end();
  }
}

chay().catch((loi) => {
  console.error(loi.message);
  process.exitCode = 1;
});
