/**
 * Controle de reprodução via Spotify Web API (RF-008).
 * Endpoints: /v1/me/player/*
 */

import { rateLimitedFetch } from './spotify/spotifyRateLimiter.js';
import {
  logSpotifyApiCall,
  logSpotifyPlayerError,
  logSpotifyRetry,
} from './spotifyPlayerLogger';
import type { SpotifyDevice } from '../types/spotify-web-playback';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
/** Fallback: nova aba (locale PT) quando não há device para a API */
export const SPOTIFY_OPEN_URL = 'https://open.spotify.com/intl-pt';

export type RepeatMode = 'off' | 'track' | 'context';

export class SpotifyApiError extends Error {
  status?: number;
  payload?: unknown;

  constructor(message: string, status?: number, payload?: unknown) {
    super(message);
    this.name = 'SpotifyApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function readJsonBody(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { raw: text };
  }
}

function cacheBustUrl(path: string): string {
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}_=${Date.now()}`;
}

async function playerRequest(
  accessToken: string,
  method: string,
  path: string,
  options: { body?: unknown; skipCacheBust?: boolean } = {},
): Promise<Response> {
  const url =
    method === 'GET' && !options.skipCacheBust
      ? `${SPOTIFY_API_BASE}${cacheBustUrl(path)}`
      : `${SPOTIFY_API_BASE}${path}`;

  logSpotifyApiCall('api_request', { method, path });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  const init: RequestInit = { method, headers };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }

  return rateLimitedFetch(url, init);
}

async function expectSuccess(
  res: Response,
  action: string,
): Promise<void> {
  if (res.status === 204 || res.ok) return;
  const payload = await readJsonBody(res);
  const err = new SpotifyApiError(`Spotify: ${action} falhou (${res.status})`, res.status, payload);
  logSpotifyPlayerError(action, err, { status: res.status, payload });
  throw err;
}

/** PUT /v1/me/player/play */
export async function play(
  accessToken: string,
  body: Record<string, unknown> = {},
): Promise<void> {
  const res = await playerRequest(accessToken, 'PUT', '/me/player/play', { body });
  await expectSuccess(res, 'play');
}

/** PUT /v1/me/player/pause */
export async function pause(accessToken: string): Promise<void> {
  const res = await playerRequest(accessToken, 'PUT', '/me/player/pause');
  await expectSuccess(res, 'pause');
}

/** POST /v1/me/player/next */
export async function next(accessToken: string): Promise<void> {
  const res = await playerRequest(accessToken, 'POST', '/me/player/next');
  await expectSuccess(res, 'next');
}

/** POST /v1/me/player/previous */
export async function previous(accessToken: string): Promise<void> {
  const res = await playerRequest(accessToken, 'POST', '/me/player/previous');
  await expectSuccess(res, 'previous');
}

/** GET /v1/me/player — estado atual (progress_ms, item, is_playing) */
export async function getCurrentPlayback(
  accessToken: string,
): Promise<import('../types/spotify-web-playback').SpotifyPlayerPlaybackState | null> {
  const res = await playerRequest(accessToken, 'GET', '/me/player');
  if (res.status === 204) return null;
  if (!res.ok) {
    const payload = await readJsonBody(res);
    const err = new SpotifyApiError('getCurrentPlayback falhou', res.status, payload);
    logSpotifyPlayerError('getCurrentPlayback', err, { status: res.status });
    throw err;
  }
  return (await res.json()) as import('../types/spotify-web-playback').SpotifyPlayerPlaybackState;
}

/** GET /v1/me/player/devices */
export async function getDevices(accessToken: string): Promise<SpotifyDevice[]> {
  const res = await playerRequest(accessToken, 'GET', '/me/player/devices');
  if (!res.ok) {
    const payload = await readJsonBody(res);
    const err = new SpotifyApiError('getDevices falhou', res.status, payload);
    logSpotifyPlayerError('getDevices', err, { status: res.status });
    throw err;
  }
  const data = (await res.json()) as { devices?: SpotifyDevice[] };
  return data.devices ?? [];
}

/**
 * PUT /v1/me/player — transferir reprodução para um dispositivo.
 * @param play - se true, retoma após transferir (opcional)
 */
export async function transferPlayback(
  accessToken: string,
  deviceId: string,
  playAfter = false,
): Promise<void> {
  const res = await playerRequest(accessToken, 'PUT', '/me/player', {
    body: { device_ids: [deviceId], play: playAfter },
  });
  await expectSuccess(res, 'transferPlayback');
}

/** PUT /v1/me/player/seek?position_ms= */
export async function seek(accessToken: string, positionMs: number): Promise<void> {
  const q = new URLSearchParams({ position_ms: String(Math.max(0, Math.floor(positionMs))) });
  const res = await playerRequest(accessToken, 'PUT', `/me/player/seek?${q.toString()}`, {
    skipCacheBust: true,
  });
  await expectSuccess(res, 'seek');
}

/** PUT /v1/me/player/shuffle?state= */
export async function setShuffle(accessToken: string, shuffleOn: boolean): Promise<void> {
  const q = new URLSearchParams({ state: String(shuffleOn) });
  const res = await playerRequest(accessToken, 'PUT', `/me/player/shuffle?${q.toString()}`, {
    skipCacheBust: true,
  });
  await expectSuccess(res, 'setShuffle');
}

/** PUT /v1/me/player/repeat?state= */
export async function setRepeat(accessToken: string, state: RepeatMode): Promise<void> {
  const q = new URLSearchParams({ state });
  const res = await playerRequest(accessToken, 'PUT', `/me/player/repeat?${q.toString()}`, {
    skipCacheBust: true,
  });
  await expectSuccess(res, 'setRepeat');
}

/**
 * Após transferPlayback: confirma via GET /me/player que o device está ativo.
 */
export async function waitForActivePlaybackOnDevice(
  accessToken: string,
  deviceId: string,
  options?: { maxAttempts?: number; baseDelayMs?: number },
): Promise<boolean> {
  const max = options?.maxAttempts ?? 6;
  const base = options?.baseDelayMs ?? 200;
  for (let i = 1; i <= max; i++) {
    const pb = await getCurrentPlayback(accessToken);
    if (pb?.device?.id === deviceId && pb.device.is_active) return true;
    await delay(Math.min(base * i, 1200));
  }
  return false;
}

// ---------------------------------------------------------------------------
// Playlist URI + playback com corpo customizado
// ---------------------------------------------------------------------------

export function toPlaylistUri(playlistId: string): string {
  if (!playlistId || typeof playlistId !== 'string') {
    throw new Error('ID da playlist é obrigatório');
  }
  return `spotify:playlist:${playlistId}`;
}

/** Alias semântico: inicia playback com body completo da API. */
export async function startPlayback(
  accessToken: string,
  body: Record<string, unknown>,
): Promise<void> {
  await play(accessToken, body);
}

export async function playPlaylist(accessToken: string, contextUri: string): Promise<void> {
  await startPlayback(accessToken, {
    context_uri: contextUri,
    offset: { position: 0 },
  });
}

export async function playFromPlaylistPosition(
  accessToken: string,
  contextUri: string,
  positionZeroBased: number,
): Promise<void> {
  await startPlayback(accessToken, {
    context_uri: contextUri,
    offset: { position: positionZeroBased },
    position_ms: 0,
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export interface EnsurePlaybackOptions {
  /** Device do Web Playback SDK (MelodIA) quando disponível */
  deviceIdHint?: string | null;
  maxRetries?: number;
  /** Chamado antes de abrir open.spotify.com em nova aba */
  onOpenSpotifyFallback?: () => void;
}

/**
 * Garante um dispositivo ativo, transfere se necessário e inicia o body de play.
 * Até 3 tentativas com backoff leve; se não houver device, abre Spotify na web e lança erro.
 */
export async function ensurePlaybackAndPlay(
  accessToken: string,
  body: Record<string, unknown>,
  options: EnsurePlaybackOptions = {},
): Promise<void> {
  const max = options.maxRetries ?? 3;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      await runOnce();
      return;
    } catch (e) {
      logSpotifyRetry('ensurePlaybackAndPlay', attempt, max, e);
      lastErr = e;
      if (attempt < max) await delay(400 * attempt);
    }
  }

  throw lastErr;

  async function runOnce(): Promise<void> {
    const devices = await getDevices(accessToken);
    const hint = options.deviceIdHint ?? null;
    const hintInList = hint ? devices.some((d) => d.id === hint) : false;

    let deviceId: string | null = null;
    if (hint && hintInList) {
      deviceId = hint;
    } else {
      const active = devices.find((d) => d.is_active);
      if (active) deviceId = active.id;
      else if (hint) deviceId = hint;
      else {
        const webLike = devices.find(
          (d) => d.type === 'Computer' || /web player|melodia/i.test(d.name),
        );
        deviceId = webLike?.id ?? devices[0]?.id ?? null;
      }
    }

    if (!deviceId) {
      options.onOpenSpotifyFallback?.();
      if (typeof window !== 'undefined') {
        window.open(SPOTIFY_OPEN_URL, '_blank', 'noopener,noreferrer');
      }
      throw new SpotifyApiError('NO_ACTIVE_DEVICE', 404, {
        error: { reason: 'NO_ACTIVE_DEVICE', message: 'Nenhum dispositivo' },
      });
    }

    await transferPlayback(accessToken, deviceId, false);
    let ready = await waitForActivePlaybackOnDevice(accessToken, deviceId);
    if (!ready) {
      logSpotifyRetry('transfer_confirm', 1, 2, new Error('Device ativo não confirmado; repetindo transfer'));
      await transferPlayback(accessToken, deviceId, false);
      ready = await waitForActivePlaybackOnDevice(accessToken, deviceId, {
        maxAttempts: 5,
        baseDelayMs: 250,
      });
    }
    if (!ready) {
      logSpotifyPlayerError(
        'waitForActivePlaybackOnDevice',
        new Error('Device ainda não ativo após transfer'),
        { deviceId },
      );
    }

    await delay(ready ? 320 : 500);
    await startPlayback(accessToken, body);
  }
}

export async function ensurePlayPlaylist(
  accessToken: string,
  contextUri: string,
  options?: EnsurePlaybackOptions,
): Promise<void> {
  await ensurePlaybackAndPlay(
    accessToken,
    { context_uri: contextUri, offset: { position: 0 } },
    options,
  );
}

export async function ensurePlayFromPlaylistPosition(
  accessToken: string,
  contextUri: string,
  positionZeroBased: number,
  options?: EnsurePlaybackOptions,
): Promise<void> {
  await ensurePlaybackAndPlay(
    accessToken,
    {
      context_uri: contextUri,
      offset: { position: positionZeroBased },
      position_ms: 0,
    },
    options,
  );
}

/**
 * Mensagens amigáveis para UI (sem expor token).
 */
export function getPlaybackErrorMessage(err: unknown): string {
  const e = err as SpotifyApiError & { status?: number; payload?: { error?: { reason?: string; message?: string } } };
  const status = e?.status;
  const payload = e?.payload as { error?: { reason?: string; message?: string } } | undefined;
  const reason = payload?.error?.reason;
  const message = String(payload?.error?.message || '');

  if (status === 401) {
    return 'Sessão expirada, faça login novamente';
  }

  if (status === 403) {
    return 'Você precisa de uma conta Spotify Premium para reproduzir músicas';
  }

  if (status === 404) {
    if (
      reason === 'NO_ACTIVE_DEVICE' ||
      e?.message === 'NO_ACTIVE_DEVICE' ||
      /no active device|device not found|não há dispositivo/i.test(message)
    ) {
      return 'Nenhum dispositivo disponível. Abra o Spotify Web para iniciar a reprodução.';
    }
  }

  if (status === 400 || status === 502 || status === 503) {
    return 'Erro ao comunicar com o Spotify';
  }

  return 'Erro ao comunicar com o Spotify';
}

/** Mensagem curta para fallback sem device (UI) */
export function getNoDeviceUserMessage(): string {
  return 'Nenhum dispositivo disponível';
}

/** Mensagem para abrir Spotify Web (toast) */
export function getOpenSpotifyWebUserMessage(): string {
  return 'Abra o Spotify Web para iniciar a reprodução';
}
