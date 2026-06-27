import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client'

collectDefaultMetrics({ prefix: 'requesthub_' })

export const httpRequestsTotal = new Counter({
  name: 'requesthub_http_requests_total',
  help: 'Total de requisições HTTP',
  labelNames: ['method', 'route', 'status_code'],
})

export const httpRequestDuration = new Histogram({
  name: 'requesthub_http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
})

export const solicitacoesTotal = new Counter({
  name: 'requesthub_solicitacoes_total',
  help: 'Total de solicitações criadas',
  labelNames: ['tipo', 'setor'],
})

export { register }
