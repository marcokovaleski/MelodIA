/**
 * Serviço para integração com N8N (workflows).
 */

const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678';
/** Workflows de IA podem levar mais de 15s; padrão conservador de 2 min */
const N8N_TIMEOUT_MS = Number(import.meta.env.VITE_N8N_TIMEOUT_MS || 120000);

/**
 * Normaliza respostas do n8n (objeto, array ou nó com `.json`).
 * @param {unknown} data
 * @returns {{ success: boolean, playlistId: string | null, tracks: number | null, raw: unknown }}
 */
export function normalizeMelodiaWebhookResponse(data) {
  if (data == null) {
    return { success: false, playlistId: null, tracks: null, raw: data };
  }

  let payload = data;
  if (Array.isArray(payload)) {
    payload = payload.find((item) => item && typeof item === 'object') ?? payload[0];
  }
  if (payload && typeof payload === 'object' && payload.json && typeof payload.json === 'object') {
    payload = payload.json;
  }
  if (payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object') {
    payload = payload.data;
  }

  const playlistId =
    payload?.playlistId ?? payload?.playlist_id ?? payload?.id ?? null;

  const tracks =
    payload?.tracks ?? payload?.trackCount ?? payload?.total ?? payload?.totalTracks ?? null;

  const successExplicit = payload?.success ?? payload?.Success;
  const success =
    successExplicit === true ||
    successExplicit === 'true' ||
    (successExplicit !== false &&
      successExplicit !== 'false' &&
      Boolean(playlistId));

  return {
    success: Boolean(success),
    playlistId:
      typeof playlistId === 'string'
        ? playlistId
        : playlistId != null
          ? String(playlistId)
          : null,
    tracks: typeof tracks === 'number' ? tracks : tracks != null ? Number(tracks) || null : null,
    raw: data,
  };
}

/**
 * Chama um workflow N8N (webhook ou API).
 * @param {string} path - Caminho do webhook (ex: /webhook/melodia)
 * @param {RequestInit} options - Opções do fetch (method, body, headers)
 * @returns {Promise<Response>}
 */
export async function callN8nWorkflow(path, options = {}) {
  const url = `${N8N_BASE_URL}${path}`.replace(/([^:]\/)\/+/g, '$1');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: options.signal ?? controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Tempo limite excedido ao comunicar com o serviço de playlist.');
    }
    throw new Error('Falha de rede ao comunicar com o serviço de playlist.');
  } finally {
    clearTimeout(timeoutId);
  }
  if (!res.ok) {
    throw new Error(`N8N request failed: ${res.status} ${res.statusText}`);
  }
  return res;
}

/**
 * Gera playlist via N8N.
 * @param {string} prompt
 * @param {string} spotifyToken
 */
export async function generatePlaylistViaN8n(prompt, spotifyToken) {
  const res = await callN8nWorkflow('/webhook/melodia', {
    method: 'POST',
    body: JSON.stringify({ prompt, spotifyToken }),
  });
  const data = await res.json();
  return normalizeMelodiaWebhookResponse(data);
}

/**
 * Edita playlist via N8N.
 * @param {string} prompt
 * @param {string} playlistId
 * @param {string} spotifyToken
 */
export async function editPlaylistViaN8n(prompt, playlistId, spotifyToken) {
  const res = await callN8nWorkflow('/webhook/melodia-edit', {
    method: 'POST',
    body: JSON.stringify({ prompt, playlistId, spotifyToken }),
  });
  const data = await res.json();
  return normalizeMelodiaWebhookResponse(data);
}

export { N8N_BASE_URL, N8N_TIMEOUT_MS };
