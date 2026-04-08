import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuthStore } from '../store/authStore';
import { refreshSpotifyAccessToken } from '../auth/spotifyPKCE.js';
import { createBrowserSpotifyPlayer } from '../lib/spotifyWebPlayback';
import {
  ensurePlayFromPlaylistPosition,
  ensurePlayPlaylist,
  getCurrentPlayback,
  getOpenSpotifyWebUserMessage,
  getPlaybackErrorMessage,
  next as apiNext,
  pause as apiPause,
  play as apiPlay,
  previous as apiPrevious,
  seek as apiSeek,
  setRepeat,
  setShuffle,
  SpotifyApiError,
} from '../services/spotifyPlayerService';
import { logPlaybackSyncDebug, logSpotifyPlayerError } from '../services/spotifyPlayerLogger';
import type { SpotifyPlaybackTrack, SpotifyPlayerPlaybackState } from '../types/spotify-web-playback';

export type PlayerBusyAction =
  | 'play'
  | 'pause'
  | 'next'
  | 'previous'
  | 'seek'
  | 'shuffle'
  | 'repeat'
  | null;

export interface PlayerContextValue {
  isPlaying: boolean;
  currentTrack: SpotifyPlaybackTrack | null;
  /** Progresso exibido (sincronizado com timestamp da API) */
  progressMs: number;
  durationMs: number;
  deviceId: string | null;
  webPlayerReady: boolean;
  shuffleState: boolean;
  repeatState: string;
  /** GET /me/player após primeiro poll */
  rawPlayback: SpotifyPlayerPlaybackState | null;
  /** Exibir PlayerDock (faixa + device ativos, sem flicker ao esvaziar) */
  isPlayerDockVisible: boolean;
  error: string | null;
  toast: string | null;
  busyAction: PlayerBusyAction;
  dismissToast: () => void;
  dismissError: () => void;
  togglePlayPause: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  toggleShuffle: () => Promise<void>;
  cycleRepeat: () => Promise<void>;
  playPlaylistUri: (playlistUri: string) => Promise<void>;
  playFromPlaylistPosition: (playlistUri: string, positionZeroBased: number) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

const SYNC_INTERVAL_MS = 500;
const HIDE_DOCK_DEBOUNCE_MS = 420;
const POST_PLAY_REFRESH_MS = 420;

function nextRepeatMode(current: string): import('../services/spotifyPlayerService').RepeatMode {
  const c = (current || 'off').toLowerCase();
  if (c === 'off') return 'context';
  if (c === 'context') return 'track';
  return 'off';
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setTokens = useAuthStore((s) => s.setTokens);

  const [rawPlayback, setRawPlayback] = useState<SpotifyPlayerPlaybackState | null>(null);
  const [playbackPollHydrated, setPlaybackPollHydrated] = useState(false);
  const [dockVisible, setDockVisible] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SpotifyPlaybackTrack | null>(null);
  const [displayProgressMs, setDisplayProgressMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [shuffleState, setShuffleState] = useState(false);
  const [repeatState, setRepeatStateState] = useState<string>('off');

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [webPlayerReady, setWebPlayerReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<PlayerBusyAction>(null);

  const webCleanupRef = useRef<(() => void) | null>(null);
  const tokenRef = useRef(accessToken);
  tokenRef.current = accessToken;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const deviceIdRef = useRef(deviceId);
  deviceIdRef.current = deviceId;

  const baseProgressRef = useRef(0);
  const baseTimestampRef = useRef(0);
  const durationRef = useRef(0);
  const lastDebugLogRef = useRef(0);

  const showUserError = useCallback((message: string) => {
    setError(message);
    setToast(message);
  }, []);

  const withToken = useCallback(
    async <T,>(fn: (token: string) => Promise<T>): Promise<T> => {
      let token = tokenRef.current;
      if (!token) throw new SpotifyApiError('Sem token', 401);
      try {
        return await fn(token);
      } catch (e) {
        const status = (e as SpotifyApiError)?.status;
        if (status === 401 && refreshToken) {
          try {
            const out = await refreshSpotifyAccessToken(refreshToken);
            setTokens(out.accessToken, out.refreshToken);
            tokenRef.current = out.accessToken;
            return await fn(out.accessToken);
          } catch (re) {
            logSpotifyPlayerError('token_refresh', re, {});
            showUserError('Sessão expirada, faça login novamente');
            throw re;
          }
        }
        throw e;
      }
    },
    [refreshToken, setTokens, showUserError],
  );

  const ingestPlaybackState = useCallback((state: SpotifyPlayerPlaybackState | null) => {
    if (!state) {
      setRawPlayback(null);
      setIsPlaying(false);
      setCurrentTrack(null);
      setDurationMs(0);
      setDisplayProgressMs(0);
      setShuffleState(false);
      setRepeatStateState('off');
      return;
    }

    setRawPlayback(state);
    setIsPlaying(Boolean(state.is_playing));
    setCurrentTrack(state.item);
    const dur = state.item?.duration_ms ?? 0;
    setDurationMs(dur);
    durationRef.current = dur;
    setShuffleState(Boolean(state.shuffle_state));
    setRepeatStateState(String(state.repeat_state || 'off'));

    const pr = state.progress_ms ?? 0;
    const ts = state.timestamp ?? Date.now();
    baseProgressRef.current = pr;
    baseTimestampRef.current = ts;

    const calculated =
      pr + (state.is_playing ? Date.now() - ts : 0);
    const capped = dur > 0 ? Math.min(calculated, dur) : calculated;
    setDisplayProgressMs(capped);
  }, []);

  const refreshPlaybackSoon = useCallback(
    async (delayMs: number) => {
      await new Promise((r) => setTimeout(r, delayMs));
      try {
        const state = await withToken((t) => getCurrentPlayback(t));
        ingestPlaybackState(state);
      } catch (e) {
        logSpotifyPlayerError('refreshPlaybackSoon', e, {});
      }
    },
    [withToken, ingestPlaybackState],
  );

  const runControl = useCallback(
    async (action: PlayerBusyAction, op: (token: string) => Promise<void>, opts?: { refreshAfterMs?: number }) => {
      if (!accessToken) {
        showUserError('Sessão expirada, faça login novamente');
        return;
      }
      setBusyAction(action);
      setError(null);
      try {
        await withToken(op);
        const d = opts?.refreshAfterMs ?? POST_PLAY_REFRESH_MS;
        void refreshPlaybackSoon(d);
      } catch (e) {
        const msg = getPlaybackErrorMessage(e);
        logSpotifyPlayerError(String(action), e, { userMessage: msg });
        showUserError(msg);
      } finally {
        setBusyAction(null);
      }
    },
    [accessToken, withToken, showUserError, refreshPlaybackSoon],
  );

  /** Web Playback SDK */
  useEffect(() => {
    if (!accessToken) {
      setDeviceId(null);
      setWebPlayerReady(false);
      if (webCleanupRef.current) {
        webCleanupRef.current();
        webCleanupRef.current = null;
      }
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { deviceId: id, disconnect } = await createBrowserSpotifyPlayer(
          () => tokenRef.current ?? accessToken,
          'MelodIA Web Player',
        );
        if (cancelled) {
          disconnect();
          return;
        }
        webCleanupRef.current = disconnect;
        setDeviceId(id);
        setWebPlayerReady(true);
      } catch (e) {
        if (!cancelled) {
          logSpotifyPlayerError('web_player_bootstrap', e, {});
          setWebPlayerReady(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (webCleanupRef.current) {
        webCleanupRef.current();
        webCleanupRef.current = null;
      }
      setDeviceId(null);
      setWebPlayerReady(false);
    };
  }, [accessToken]);

  /** Polling 1s */
  useEffect(() => {
    if (!accessToken) {
      setPlaybackPollHydrated(false);
      ingestPlaybackState(null);
      return;
    }

    let alive = true;

    const tick = async () => {
      try {
        const state = await withToken((t) => getCurrentPlayback(t));
        if (!alive) return;
        ingestPlaybackState(state);
      } catch (e) {
        if (!alive) return;
        logSpotifyPlayerError('poll_playback', e, {});
      } finally {
        if (alive) setPlaybackPollHydrated(true);
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [accessToken, withToken, ingestPlaybackState]);

  /** Debounce esconder dock (evita flicker em troca de faixa) */
  useEffect(() => {
    const want = Boolean(rawPlayback?.item && rawPlayback?.device);
    if (want) {
      setDockVisible(true);
      return;
    }
    const t = window.setTimeout(() => setDockVisible(false), HIDE_DOCK_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [rawPlayback]);

  /** Progresso em tempo real: progress_ms + (now - timestamp) */
  useEffect(() => {
    if (!isPlaying) {
      setDisplayProgressMs(baseProgressRef.current);
      return;
    }

    const id = window.setInterval(() => {
      const pr = baseProgressRef.current;
      const ts = baseTimestampRef.current;
      const dur = durationRef.current;
      const calculated = pr + (Date.now() - ts);
      const capped = dur > 0 ? Math.min(calculated, dur) : calculated;
      setDisplayProgressMs(capped);

      const now = Date.now();
      if (now - lastDebugLogRef.current > 1500) {
        lastDebugLogRef.current = now;
        const drift = calculated - pr;
        logPlaybackSyncDebug({
          progress_ms: pr,
          timestamp: ts,
          calculatedProgress: calculated,
          drift,
          is_playing: true,
        });
      }
    }, SYNC_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [isPlaying]);

  const togglePlayPause = useCallback(async () => {
    const playing = isPlayingRef.current;
    await runControl(playing ? 'pause' : 'play', async (t) => {
      if (playing) await apiPause(t);
      else await apiPlay(t, {});
    });
  }, [runControl]);

  const nextTrack = useCallback(async () => {
    await runControl('next', (t) => apiNext(t));
  }, [runControl]);

  const previousTrack = useCallback(async () => {
    await runControl('previous', (t) => apiPrevious(t));
  }, [runControl]);

  const seekTo = useCallback(
    async (positionMs: number) => {
      await runControl(
        'seek',
        async (t) => {
          await apiSeek(t, positionMs);
        },
        { refreshAfterMs: 280 },
      );
    },
    [runControl],
  );

  const toggleShuffle = useCallback(async () => {
    const next = !shuffleState;
    await runControl('shuffle', (t) => setShuffle(t, next));
  }, [runControl, shuffleState]);

  const cycleRepeat = useCallback(async () => {
    const mode = nextRepeatMode(repeatState);
    await runControl('repeat', (t) => setRepeat(t, mode));
  }, [runControl, repeatState]);

  const playPlaylistUri = useCallback(
    async (playlistUri: string) => {
      await runControl(
        'play',
        async (t) => {
          await ensurePlayPlaylist(t, playlistUri, {
            deviceIdHint: deviceIdRef.current,
            onOpenSpotifyFallback: () => {
              setToast(getOpenSpotifyWebUserMessage());
            },
          });
        },
        { refreshAfterMs: POST_PLAY_REFRESH_MS },
      );
    },
    [runControl],
  );

  const playFromPlaylistPosition = useCallback(
    async (playlistUri: string, positionZeroBased: number) => {
      await runControl(
        'play',
        async (t) => {
          await ensurePlayFromPlaylistPosition(t, playlistUri, positionZeroBased, {
            deviceIdHint: deviceIdRef.current,
            onOpenSpotifyFallback: () => {
              setToast(getOpenSpotifyWebUserMessage());
            },
          });
        },
        { refreshAfterMs: POST_PLAY_REFRESH_MS },
      );
    },
    [runControl],
  );

  const dismissToast = useCallback(() => setToast(null), []);
  const dismissError = useCallback(() => {
    setError(null);
    setToast(null);
  }, []);

  const isPlayerDockVisible = playbackPollHydrated && dockVisible;

  const value = useMemo<PlayerContextValue>(
    () => ({
      isPlaying,
      currentTrack,
      progressMs: displayProgressMs,
      durationMs,
      deviceId,
      webPlayerReady,
      shuffleState,
      repeatState,
      rawPlayback,
      isPlayerDockVisible,
      error,
      toast,
      busyAction,
      dismissToast,
      dismissError,
      togglePlayPause,
      nextTrack,
      previousTrack,
      seekTo,
      toggleShuffle,
      cycleRepeat,
      playPlaylistUri,
      playFromPlaylistPosition,
    }),
    [
      isPlaying,
      currentTrack,
      displayProgressMs,
      durationMs,
      deviceId,
      webPlayerReady,
      shuffleState,
      repeatState,
      rawPlayback,
      isPlayerDockVisible,
      error,
      toast,
      busyAction,
      dismissToast,
      dismissError,
      togglePlayPause,
      nextTrack,
      previousTrack,
      seekTo,
      toggleShuffle,
      cycleRepeat,
      playPlaylistUri,
      playFromPlaylistPosition,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayerContext(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayerContext must be used within PlayerProvider');
  return ctx;
}
