// MIME types aceitos para upload de CSV
const ALLOWED_CSV_MIMETYPES = new Set([
  'text/csv',
  'text/plain',
  'application/csv',
  'application/vnd.ms-excel',
  'application/octet-stream', // alguns SOs enviam isso para .csv
])

export function validateCsvFile(filename: string, mimetype: string): string | null {
  if (!filename.toLowerCase().endsWith('.csv')) {
    return 'Formato inválido. Envie um arquivo .csv'
  }
  if (!ALLOWED_CSV_MIMETYPES.has(mimetype.toLowerCase().split(';')[0].trim())) {
    return 'Tipo de arquivo não permitido'
  }
  return null
}
