// Testa envio de trace para Grafana Tempo via OTLP
const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? ''
const instanceId = process.env.OTEL_INSTANCE_ID ?? ''
const apiToken   = process.env.OTEL_API_TOKEN ?? ''

if (!endpoint || !instanceId || !apiToken) {
  console.error('❌ Variáveis OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_INSTANCE_ID e OTEL_API_TOKEN não configuradas')
  process.exit(1)
}

const credentials = Buffer.from(`${instanceId}:${apiToken}`).toString('base64')
const url = `${endpoint}/v1/traces`

console.log(`\nTestando Tempo em: ${url}`)
console.log(`Instance ID: ${instanceId}\n`)

// Payload OTLP mínimo com 1 span
const now = Date.now()
const traceId = 'aabbccdd00112233aabbccdd00112233'
const spanId  = 'aabbccdd00112233'

const payload = {
  resourceSpans: [{
    resource: {
      attributes: [
        { key: 'service.name', value: { stringValue: 'requesthub-api' } },
        { key: 'service.version', value: { stringValue: '0.1.0' } },
      ],
    },
    scopeSpans: [{
      scope: { name: 'test-script', version: '1.0' },
      spans: [{
        traceId,
        spanId,
        name: 'POST /transferencias',
        kind: 2, // SERVER
        startTimeUnixNano: String(now * 1_000_000),
        endTimeUnixNano:   String((now + 120) * 1_000_000),
        status: { code: 1 }, // OK
        attributes: [
          { key: 'http.method', value: { stringValue: 'POST' } },
          { key: 'http.route',  value: { stringValue: '/transferencias' } },
          { key: 'http.status_code', value: { intValue: 201 } },
        ],
      }],
    }],
  }],
}

const res = await fetch(url, {
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

if (res.ok) {
  console.log('\n✅ Tempo OK — span enviado com sucesso!')
  console.log(`   Procure no Explore → Tempo → TraceQL: { .service.name = "requesthub-api" }`)
  console.log(`   TraceID: ${traceId}\n`)
} else {
  console.log('\n❌ Falhou — verifique endpoint e credenciais\n')
  if (res.status === 401) console.log('   → Token inválido ou Instance ID errado')
  if (res.status === 403) console.log('   → Token sem permissão de escrita')
  if (res.status === 404) console.log('   → URL incorreta')
}
