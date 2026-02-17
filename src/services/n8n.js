/**
 * Serviço para integração com N8N (workflows).
 * Estrutura pronta para expansão com fetch/axios.
 */

const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || '';

/**
 * Chama um workflow N8N (webhook ou API).
 * @param {string} path - Caminho do webhook (ex: /webhook/gerar-playlist)
 * @param {RequestInit} options - Opções do fetch (method, body, headers)
 * @returns {Promise<Response>}
 */
export async function callN8nWorkflow(path, options = {}) {
  const url = `${N8N_BASE_URL}${path}`.replace(/([^:]\/)\/+/g, '$1');
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`N8N request failed: ${res.status} ${res.statusText}`);
  }
  return res;
}

/**
 * Gera playlist via N8N (stub).
 * @param {string} prompt - Descrição da playlist
 * @param {object} options - Opções (ex: userId, spotifyToken ref)
 */
export async function generatePlaylistViaN8n(prompt, options = {}) {
  // TODO: implementar quando o workflow N8N estiver definido
  const path = '/webhook/gerar-playlist';
  const body = { prompt, ...options };
  const res = await callN8nWorkflow(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res.json();
}

export { N8N_BASE_URL };
