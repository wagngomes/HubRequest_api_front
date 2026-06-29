// Testa a conexão com o Loki diretamente (sem pino)
const LOKI_URL  = process.env.LOKI_URL  ?? 'https://logs-prod-024.grafana.net'
const LOKI_USER = process.env.LOKI_USER ?? ''
const LOKI_PASS = process.env.LOKI_PASSWORD ?? ''

const credentials = Buffer.from(`${LOKI_USER}:${LOKI_PASS}`).toString('base64')

const payload = {
  streams: [{
    stream: { app: 'requesthub-api', env: 'test' },
    values: [
      [String(Date.now() * 1_000_000), 'Teste de conexão com Loki — diagnóstico'],
    ],
  }],
}

console.log(`\nTestando Loki em: ${LOKI_URL}/loki/api/v1/push`)
console.log(`User: ${LOKI_USER}\n`)

const res = await fetch(`${LOKI_URL}/loki/api/v1/push`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${credentials}`,
  },
  body: JSON.stringify(payload),
})

console.log(`Status: ${res.status} ${res.statusText}`)
const body = await res.text()
if (body) console.log(`Resposta: ${body}`)

if (res.status === 204) {
  console.log('\n✅ Loki OK — log enviado com sucesso!\n')
} else {
  console.log('\n❌ Falhou — verifique URL e credenciais\n')
}
