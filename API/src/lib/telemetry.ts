import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { SimpleSpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
const isDev    = process.env.NODE_ENV !== 'production'

function makeHeaders(): Record<string, string> {
  if (!endpoint) return {}
  const credentials = Buffer.from(
    `${process.env.OTEL_INSTANCE_ID}:${process.env.OTEL_API_TOKEN}`,
  ).toString('base64')
  return { Authorization: `Basic ${credentials}` }
}

const headers = makeHeaders()

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    'service.name': 'requesthub-api',
    'service.version': '0.1.0',
    'deployment.environment': process.env.NODE_ENV ?? 'development',
  }),

  ...(endpoint && {
    spanProcessor: isDev
      ? new SimpleSpanProcessor(new OTLPTraceExporter({ url: `${endpoint}/v1/traces`, headers }))
      : new BatchSpanProcessor(new OTLPTraceExporter({ url: `${endpoint}/v1/traces`, headers })),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({ url: `${endpoint}/v1/metrics`, headers }),
      exportIntervalMillis: 30_000,
    }),
  }),

  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs':  { enabled: false },
      '@opentelemetry/instrumentation-dns': { enabled: false },
    }),
  ],
})

export default sdk
