/**
 * Rate Limiter global para a API do Spotify (api.spotify.com).
 * - Rolling window 30s, fila de requisições, retry com backoff em 429.
 * - Cache opcional 30–60s para GET.
 * - Não altera comportamento do app; apenas adiciona proteção.
 */

const SPOTIFY_API_HOST = 'api.spotify.com';

/** Janela de tempo em ms (Spotify costuma usar 30s) */
const WINDOW_MS = 30_000;

/** Máximo de requisições na janela (conservador para evitar 429) */
const MAX_REQUESTS_PER_WINDOW = 50;

/** Quando atingir este % da janela, aplica slowdown e log */
const SLOWDOWN_THRESHOLD = 0.8;

/** Cache TTL em ms (entre 30–60s) */
const CACHE_TTL_MS = 45_000;

/** Backoff exponencial: 1s, 2s, 4s, 8s, máx 20s */
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 20_000;

/** Máximo de retries por requisição em caso de 429 */
const MAX_RETRIES_429 = 5;

/** Timestamps dos requests na janela rolling (só para api.spotify.com) */
let windowTimestamps = [];

/** Fila de tarefas pendentes: { url, options, resolve, reject, retryCount } */
const queue = [];

/** Em processamento (evita disparar várias ao mesmo tempo) */
let processing = false;

/** Cache GET: key (url) -> { body, status, headers, expires } */
const cache = new Map();

/** Limpa entradas expiradas do cache */
function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expires <= now) cache.delete(key);
  }
}

/** Retorna quantos requests ainda estão na janela rolling */
function countInWindow() {
  const now = Date.now();
  windowTimestamps = windowTimestamps.filter((t) => now - t < WINDOW_MS);
  return windowTimestamps.length;
}

/** Aguarda até haver espaço na janela (com timeout para não travar) */
function waitForWindowSlot() {
  return new Promise((resolve) => {
    const check = () => {
      const inWindow = countInWindow();
      if (inWindow < MAX_REQUESTS_PER_WINDOW) {
        if (inWindow >= MAX_REQUESTS_PER_WINDOW * SLOWDOWN_THRESHOLD) {
          if (typeof console !== 'undefined' && console.info) {
            console.info('Rate Limit approaching — applying slowdown.');
          }
          setTimeout(resolve, 150);
          return;
        }
        resolve();
        return;
      }
      setTimeout(check, 200);
    };
    check();
  });
}

/** Delay com backoff exponencial; respeita Retry-After se fornecido */
function getRetryDelay(retryCount, retryAfterSeconds) {
  if (retryAfterSeconds != null && retryAfterSeconds > 0) {
    return Math.min(retryAfterSeconds * 1000, BACKOFF_MAX_MS);
  }
  const exp = Math.min(retryCount, 4);
  return Math.min(BACKOFF_BASE_MS * 2 ** exp, BACKOFF_MAX_MS);
}

/**
 * Gera chave de cache (URL + method).
 * Para playlists, a mesma URL (incl. playlist id e offset) retorna cache enquanto válida;
 * assim evita-se recarregar lista completa se snapshot_id não mudou (cache TTL 45s).
 */
function cacheKey(url, options) {
  const method = (options?.method || 'GET').toUpperCase();
  return method === 'GET' ? url : null;
}

/** Consulta cache (apenas GET); retorna resposta clonável ou null */
function getCached(key) {
  if (!key) return null;
  pruneCache();
  const entry = cache.get(key);
  if (!entry || entry.expires <= Date.now()) return null;
  return entry;
}

/** Salva no cache (apenas GET, 2xx) */
function setCache(key, body, status, headers) {
  if (!key || status < 200 || status >= 300) return;
  cache.set(key, {
    body,
    status,
    headers: headers ? { ...headers } : {},
    expires: Date.now() + CACHE_TTL_MS,
  });
}

/** Verifica se a URL é da API do Spotify (aplica rate limit e cache) */
function isSpotifyApiUrl(url) {
  try {
    const u = typeof url === 'string' ? url : url?.url;
    return u && u.includes(SPOTIFY_API_HOST);
  } catch {
    return false;
  }
}

/** Prioridade para endpoints batch (ids=) — podem ser tratados primeiro */
function isBatchRequest(url) {
  return typeof url === 'string' && (url.includes('ids=') || url.includes('ids%3D'));
}

/** Executa uma única requisição (com retry em 429) */
async function executeOne({ url, options, resolve, reject, retryCount = 0 }) {
  await waitForWindowSlot();

  const key = cacheKey(url, options);
  const method = (options?.method || 'GET').toUpperCase();
  if (method === 'GET' && key) {
    const cached = getCached(key);
    if (cached) {
      try {
        const cloned = {
          ok: cached.status >= 200 && cached.status < 300,
          status: cached.status,
          headers: new Headers(cached.headers),
          json: () => Promise.resolve(cached.body),
          text: () => Promise.resolve(typeof cached.body === 'string' ? cached.body : JSON.stringify(cached.body)),
          clone: () => cloned,
        };
        resolve(cloned);
        return;
      } catch (_) {
        // fallback: seguir com fetch
      }
    }
  }

  windowTimestamps.push(Date.now());

  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    reject(err);
    return;
  }

  if (res.status === 429) {
    if (retryCount >= MAX_RETRIES_429) {
      reject(new Error(`Rate limited (429) after ${MAX_RETRIES_429} retries`));
      return;
    }
    const retryAfter = res.headers.get('Retry-After');
    const seconds = retryAfter ? parseInt(retryAfter, 10) : null;
    const delayMs = getRetryDelay(retryCount, seconds);
    setTimeout(() => {
      queue.unshift({ url, options, resolve, reject, retryCount: retryCount + 1 });
      processQueue();
    }, delayMs);
    return;
  }

  if (method === 'GET' && res.ok && key) {
    try {
      const clone = res.clone();
      const body = await clone.json().catch(() => clone.text());
      setCache(key, body, res.status, Object.fromEntries(res.headers.entries()));
    } catch (_) {
      // ignore cache write
    }
  }

  resolve(res);
}

/** Processa a fila (um item por vez para controle de taxa) */
async function processQueue() {
  if (processing || queue.length === 0) return;

  processing = true;

  // Prioriza batch (ids=) se houver
  let index = queue.findIndex((q) => isBatchRequest(q.url));
  if (index < 0) index = 0;
  const item = queue.splice(index, 1)[0];

  try {
    await executeOne(item);
  } finally {
    processing = false;
    if (queue.length > 0) {
      setTimeout(processQueue, 0);
    }
  }
}

/**
 * Fetch com rate limit, retry em 429 e cache opcional para GET.
 * Use em todas as chamadas à API do Spotify (api.spotify.com).
 * Para outras URLs, delega ao fetch nativo sem alterar comportamento.
 *
 * @param {string} url - URL da requisição
 * @param {RequestInit} [options] - Opções do fetch (headers, method, etc.)
 * @returns {Promise<Response>} - Response (pode ser do cache ou retry)
 */
export function rateLimitedFetch(url, options = {}) {
  if (!isSpotifyApiUrl(url)) {
    return fetch(url, options);
  }

  return new Promise((resolve, reject) => {
    const item = { url, options, resolve, reject, retryCount: 0 };
    if (isBatchRequest(url)) {
      queue.unshift(item);
    } else {
      queue.push(item);
    }
    processQueue();
  });
}

export default rateLimitedFetch;
