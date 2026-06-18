/**
 * Cálculo de posição de reprodução.
 *
 * A Web API do Spotify devolve `timestamp` como o instante da última mudança
 * de estado (início da faixa, pause, seek) — não o momento do fetch.
 * Somar (now - timestamp) a um `progress_ms` já atualizado duplica o avanço (~2x).
 *
 * Estratégia: usar `progress_ms` como verdade no recebimento da resposta e
 * interpolar só com relógio local entre polls/eventos do SDK.
 */

export function clampProgressMs(progressMs: number, durationMs: number): number {
  if (!Number.isFinite(progressMs) || progressMs < 0) return 0;
  if (!durationMs || durationMs <= 0) return progressMs;
  return Math.min(progressMs, durationMs);
}

/** Posição ao receber estado da API (sem extrapolar pelo timestamp do Spotify). */
export function positionFromApiSnapshot(progressMs: number, durationMs: number): number {
  return clampProgressMs(progressMs, durationMs);
}

/** Posição interpolada entre dois snapshots (âncora no cliente). */
export function interpolateFromAnchor(
  anchorProgressMs: number,
  anchorClientMs: number,
  durationMs: number,
  atMs: number = Date.now(),
): number {
  const elapsed = Math.max(0, atMs - anchorClientMs);
  return clampProgressMs(anchorProgressMs + elapsed, durationMs);
}
