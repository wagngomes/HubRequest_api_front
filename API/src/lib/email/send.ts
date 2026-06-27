import { Resend } from 'resend'
import { prisma } from '../prisma.js'

const getResend = () => new Resend(process.env.RESEND_API_KEY)
const FROM = () => process.env.EMAIL_FROM ?? 'onboarding@resend.dev'
const APP_URL = () => process.env.FRONT_URL ?? 'http://localhost:3000'

async function getNotificationEmails(tipo: 'transferencia' | 'liberacao'): Promise<string[]> {
  const specificKey =
    tipo === 'transferencia' ? 'notificationEmailsTransferencia' : 'notificationEmailsLiberacao'

  const [specific, legacy] = await Promise.all([
    prisma.appConfig.findUnique({ where: { key: specificKey } }),
    prisma.appConfig.findUnique({ where: { key: 'notificationEmails' } }),
  ])

  const value = specific?.value || legacy?.value || ''
  return value
    .split(';')
    .map((e) => e.trim())
    .filter((e) => e.length > 0)
}

export interface ItemComPrevisao {
  codigo: string
  descricao: string
  origem: string
  destino: string
  quantidade: number
  previsaoChegada?: string
}

interface NovaSolicitacaoParams {
  tipo: 'transferencia' | 'liberacao'
  solicitante: string
  detalhes: string
  id: string
  itensComPrevisao?: ItemComPrevisao[]
}

export async function sendNovaSolicitacaoEmail(params: NovaSolicitacaoParams): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder') return

  try {
    const destinatarios = await getNotificationEmails(params.tipo)
    if (destinatarios.length === 0) return

    const tipoLabel = params.tipo === 'transferencia' ? 'Transferência' : 'Liberação Pitágoras'
    const link = `${APP_URL()}/${params.tipo === 'transferencia' ? 'transferencias' : 'liberacoes'}`

    const tabelaItens =
      params.itensComPrevisao && params.itensComPrevisao.length > 0
        ? `<table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:13px;">
            <thead><tr style="background:#EBF5F9;">
              <th style="text-align:left;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Código</th>
              <th style="text-align:left;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Descrição</th>
              <th style="text-align:left;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Origem → Destino</th>
              <th style="text-align:center;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Qtd</th>
              <th style="text-align:left;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Previsão</th>
            </tr></thead>
            <tbody>${params.itensComPrevisao
              .map(
                (item, i) =>
                  `<tr style="background:${i % 2 === 0 ? '#fff' : '#F9FAFB'};">
                    <td style="padding:8px 10px;font-family:monospace;color:#16455C;font-weight:600;">${item.codigo}</td>
                    <td style="padding:8px 10px;color:#374151;">${item.descricao}</td>
                    <td style="padding:8px 10px;color:#374151;">${item.origem} → ${item.destino}</td>
                    <td style="padding:8px 10px;text-align:center;color:#374151;">${item.quantidade}</td>
                    <td style="padding:8px 10px;color:${item.previsaoChegada ? '#2E9B7C' : '#9CA3AF'};">${item.previsaoChegada ?? 'SLA não configurado'}</td>
                  </tr>`
              )
              .join('')}</tbody>
          </table>`
        : `<p style="color:#374151;"><strong>Detalhes:</strong> ${params.detalhes}</p>`

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
        <div style="background:#16455C;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">🔔 Nova ${tipoLabel}</h1>
          <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;">Hub Request Plan</p>
        </div>
        <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:0;">
          <p style="color:#374151;margin:0 0 8px;"><strong>Solicitante:</strong> ${params.solicitante}</p>
          <p style="color:#374151;margin:0 0 16px;"><strong>ID:</strong>
            <span style="font-family:monospace;font-size:15px;color:#16455C;font-weight:700;">${params.id}</span>
          </p>
          ${tabelaItens}
          <div style="margin-top:20px;">
            <a href="${link}" style="display:inline-block;background:#16455C;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
              Ver no Portal
            </a>
          </div>
        </div>
      </div>`

    await Promise.all(
      destinatarios.map((to) =>
        getResend().emails.send({
          from: FROM(),
          to,
          subject: `[Hub Request Plan] Nova ${tipoLabel} — ${params.solicitante}`,
          html,
        })
      )
    )
  } catch (err) {
    console.error('[Email] sendNovaSolicitacaoEmail:', err)
  }
}

interface ConfirmacaoParams {
  destinatario: string
  nome: string
  tipo: 'transferencia' | 'liberacao'
  id: string
  detalhes: string
  itensComPrevisao?: ItemComPrevisao[]
}

export async function sendConfirmacaoSolicitacaoEmail(params: ConfirmacaoParams): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder') return

  try {
    const tipoLabel = params.tipo === 'transferencia' ? 'Transferência' : 'Liberação Pitágoras'
    const link = `${APP_URL()}/${params.tipo === 'transferencia' ? 'transferencias' : 'liberacoes'}`

    const tabelaItens =
      params.itensComPrevisao && params.itensComPrevisao.length > 0
        ? `<table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:13px;">
            <thead><tr style="background:#EBF5F9;">
              <th style="text-align:left;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Código</th>
              <th style="text-align:left;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Descrição</th>
              <th style="text-align:left;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Origem → Destino</th>
              <th style="text-align:center;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Qtd</th>
              <th style="text-align:left;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Previsão</th>
            </tr></thead>
            <tbody>${params.itensComPrevisao
              .map(
                (item, i) =>
                  `<tr style="background:${i % 2 === 0 ? '#fff' : '#F9FAFB'};">
                    <td style="padding:8px 10px;font-family:monospace;color:#16455C;font-weight:600;">${item.codigo}</td>
                    <td style="padding:8px 10px;color:#374151;">${item.descricao}</td>
                    <td style="padding:8px 10px;color:#374151;">${item.origem} → ${item.destino}</td>
                    <td style="padding:8px 10px;text-align:center;color:#374151;">${item.quantidade}</td>
                    <td style="padding:8px 10px;color:${item.previsaoChegada ? '#2E9B7C' : '#9CA3AF'};">${item.previsaoChegada ?? 'SLA não configurado'}</td>
                  </tr>`
              )
              .join('')}</tbody>
          </table>`
        : `<p style="color:#374151;"><strong>Detalhes:</strong> ${params.detalhes}</p>`

    await getResend().emails.send({
      from: FROM(),
      to: params.destinatario,
      subject: `[Hub Request Plan] Solicitação recebida — ${tipoLabel} #${params.id}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
          <div style="background:#2E9B7C;padding:24px;border-radius:8px 8px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;">✅ Solicitação Recebida</h1>
          </div>
          <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:0;">
            <p style="color:#374151;">Olá, <strong>${params.nome}</strong>!</p>
            <p style="color:#374151;">Sua solicitação de <strong>${tipoLabel}</strong> foi recebida e está em análise.</p>
            <p style="color:#374151;"><strong>ID:</strong>
              <span style="font-family:monospace;font-size:15px;color:#16455C;font-weight:700;">${params.id}</span>
            </p>
            ${tabelaItens}
            <div style="margin-top:20px;">
              <a href="${link}" style="display:inline-block;background:#16455C;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
                Acompanhar
              </a>
            </div>
          </div>
        </div>`,
    })
  } catch (err) {
    console.error('[Email] sendConfirmacaoSolicitacaoEmail:', err)
  }
}

interface StatusAtualizadoParams {
  destinatario: string
  nome: string
  tipo: string
  novoStatus: string
  notaFiscal?: string
  obs?: string
  id: string
}

export async function sendStatusAtualizadoEmail(params: StatusAtualizadoParams): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder') return

  try {
    const isAprovada = params.novoStatus === 'PROCESSADA' || params.novoStatus === 'APROVADA'
    const cor = isAprovada ? '#2E9B7C' : '#ef4444'
    const icone = isAprovada ? '✅' : '❌'

    await getResend().emails.send({
      from: FROM(),
      to: params.destinatario,
      subject: `[Hub Request Plan] Atualização — ${params.tipo} ${icone}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:${cor};padding:24px;border-radius:8px 8px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;">${icone} Solicitação Atualizada</h1>
          </div>
          <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:0;">
            <p style="color:#374151;">Olá, <strong>${params.nome}</strong>!</p>
            <div style="background:#F5F5F5;border-left:4px solid ${cor};padding:12px 16px;border-radius:4px;margin-bottom:16px;">
              <p style="margin:0;color:#374151;"><strong>Novo Status:</strong> ${params.novoStatus}</p>
              ${params.notaFiscal ? `<p style="margin:4px 0 0;color:#374151;"><strong>Nota Fiscal:</strong> <span style="font-family:monospace;font-weight:700;">${params.notaFiscal}</span></p>` : ''}
              ${params.obs && params.obs !== '-' ? `<p style="margin:4px 0 0;color:#374151;"><strong>Obs:</strong> ${params.obs}</p>` : ''}
            </div>
            <a href="${APP_URL()}" style="display:inline-block;background:#16455C;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Ver no Portal</a>
          </div>
        </div>`,
    })
  } catch (err) {
    console.error('[Email] sendStatusAtualizadoEmail:', err)
  }
}
