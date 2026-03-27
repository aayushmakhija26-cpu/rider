const { Client } = require('pg')
require('dotenv').config({ path: '.env.local' })

const rawUrl = process.env.DATABASE_URL
const cleanUrl = rawUrl.replace(/[?&]sslmode=[^&]*/g, '').replace(/\?$/, '')

console.log('Connecting (60s timeout)...')
const start = Date.now()

const client = new Client({
  connectionString: cleanUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 60000,
  family: 4,
})

client.connect()
  .then(() => {
    console.log('Connected after', Date.now() - start, 'ms')
    return client.query('SELECT NOW() as t')
  })
  .then(r => {
    console.log('✅ Success:', r.rows[0].t)
    client.end()
  })
  .catch(e => {
    console.error('❌ Error after', Date.now() - start, 'ms:', e.message, '|', e.code)
    client.end().catch(() => {})
  })
