import { env } from '@/config';

// ============================================
// GOOGLE DRIVE VIDEO STREAMING
// ============================================

/**
 * Extrai o fileId de uma URL do Google Drive
 * Suporta formatos:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/uc?export=download&id=FILE_ID
 * - https://drive.google.com/open?id=FILE_ID
 * - FILE_ID direto
 */
export function extractDriveFileId(input: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,           // /file/d/FILE_ID/
    /[?&]id=([a-zA-Z0-9_-]+)/,               // ?id=FILE_ID ou &id=FILE_ID
    /^([a-zA-Z0-9_-]{25,})$/,                // FILE_ID direto (mín 25 chars)
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Constrói a URL de download direto do Google Drive
 * Nota: Para arquivos grandes, o Drive pode retornar uma página de confirmação
 * em vez do arquivo direto. O streaming lida com isso via Range requests.
 */
export function buildDriveDownloadUrl(fileId: string): string {
  return `${env.DRIVE_PUBLIC_BASE_URL}${fileId}`;
}

/**
 * Valida se uma string é uma URL/ID do Google Drive válida
 */
export function isValidDriveInput(input: string): boolean {
  return extractDriveFileId(input) !== null;
}

/**
 * Headers necessários para streaming de vídeo com suporte a Range
 */
export const VIDEO_STREAM_HEADERS = {
  'Accept-Ranges': 'bytes',
  'Content-Type': 'video/mp4', // Será sobrescrito pelo Content-Type real do Drive
  'Cache-Control': 'public, max-age=3600', // 1 hora de cache no browser/CDN
} as const;

/**
 * Faz proxy do stream do Google Drive com suporte a Range requests
 * Retorna: { stream: ReadableStream, contentLength: number, contentType: string, contentRange?: string }
 */
export async function proxyDriveStream(
  fileId: string,
  rangeHeader?: string
): Promise<{
  stream: ReadableStream<Uint8Array>;
  contentLength: number;
  contentType: string;
  contentRange?: string;
  statusCode: number;
}> {
  const driveUrl = buildDriveDownloadUrl(fileId);

  const headers: Record<string, string> = {
    'User-Agent': 'Luly-Backend/1.0',
  };

  if (rangeHeader) {
    headers.Range = rangeHeader;
  }

  const response = await fetch(driveUrl, {
    headers,
    // Não seguir redirects automaticamente para lidar com página de confirmação
    redirect: 'manual',
  });

  // Lidar com redirects (página de confirmação de vírus para arquivos grandes)
  if (response.status === 302 || response.status === 303) {
    const location = response.headers.get('Location');
    if (location) {
      // Seguir o redirect uma vez
      const redirectedResponse = await fetch(location, {
        headers: rangeHeader ? { Range: rangeHeader } : {},
      });
      return processDriveResponse(redirectedResponse, rangeHeader);
    }
  }

  return processDriveResponse(response, rangeHeader);
}

async function processDriveResponse(
  response: Response,
  rangeHeader?: string
): Promise<{
  stream: ReadableStream<Uint8Array>;
  contentLength: number;
  contentType: string;
  contentRange?: string;
  statusCode: number;
}> {
  const contentType = response.headers.get('Content-Type') || 'video/mp4';
  const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10);
  const contentRange = response.headers.get('Content-Range') || undefined;
  const acceptRanges = response.headers.get('Accept-Ranges');

  // Se não suporta Range, mas o cliente pediu, retornar 200 com o arquivo completo
  const statusCode = rangeHeader && response.status === 206 ? 206 : response.status;

  if (!response.body) {
    throw new Error('Empty response body from Google Drive');
  }

  return {
    stream: response.body,
    contentLength,
    contentType,
    contentRange,
    statusCode,
  };
}

/**
 * Parse do header Range: "bytes=START-END"
 * Retorna { start, end } onde end pode ser undefined (até o fim)
 */
export function parseRangeHeader(rangeHeader: string, totalSize: number): { start: number; end: number } | null {
  const match = rangeHeader.match(/^bytes=(\d+)-(\d*)$/);
  if (!match) return null;

  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;

  if (start >= totalSize || end >= totalSize) return null;

  return { start, end: Math.min(end, totalSize - 1) };
}

/**
 * Formata Content-Range header: "bytes START-END/TOTAL"
 */
export function formatContentRange(start: number, end: number, total: number): string {
  return `bytes ${start}-${end}/${total}`;
}