type LogLevel = 'info' | 'warn' | 'error';

const PREFIX = '[Spotify Player]';

function basePayload(extra: Record<string, unknown>) {
  return { ...extra, timestamp: new Date().toISOString() };
}

export function logSpotifyApiCall(
  action: string,
  meta: Record<string, unknown> = {},
): void {
  console.info(PREFIX, action, basePayload({ action, ...meta }));
}

export function logSpotifyPlayerError(
  action: string,
  err: unknown,
  extra: Record<string, unknown> = {},
): void {
  const e = err as { message?: string; status?: number; response?: { status?: number } };
  console.error(`[Spotify Player Error]`, {
    action,
    status: e?.status ?? e?.response?.status,
    message: e?.message ?? String(err),
    ...extra,
    timestamp: new Date().toISOString(),
  });
}

export function logSpotifyRetry(
  action: string,
  attempt: number,
  maxAttempts: number,
  err: unknown,
): void {
  console.warn(PREFIX, 'retry', {
    action,
    attempt,
    maxAttempts,
    error: err instanceof Error ? err.message : String(err),
    timestamp: new Date().toISOString(),
  });
}

export function logSpotifyPlayer(level: LogLevel, message: string, meta: Record<string, unknown> = {}): void {
  const payload = basePayload(meta);
  if (level === 'error') console.error(PREFIX, message, payload);
  else if (level === 'warn') console.warn(PREFIX, message, payload);
  else console.info(PREFIX, message, payload);
}

/** Sincronização progress_ms × timestamp (drift vs polling) */
export function logPlaybackSyncDebug(meta: {
  progress_ms: number;
  timestamp: number;
  calculatedProgress: number;
  drift: number;
  is_playing: boolean;
}): void {
  console.debug('[Playback Sync]', {
    ...meta,
    wallTime: Date.now(),
    iso: new Date().toISOString(),
  });
}
