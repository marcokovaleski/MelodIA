/** Declarações mínimas para o script https://sdk.scdn.co/spotify-player.js */

export interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number | null;
}

/** Dispositivo retornado em GET /v1/me/player */
export interface SpotifyPlaybackDeviceInfo {
  id: string;
  is_active: boolean;
  is_private_session?: boolean;
  is_restricted?: boolean;
  name: string;
  type: string;
  volume_percent?: number | null;
}

export interface SpotifyPlayerPlaybackState {
  device: SpotifyPlaybackDeviceInfo | null;
  context: { uri: string | null } | null;
  timestamp: number;
  progress_ms: number;
  is_playing: boolean;
  item: SpotifyPlaybackTrack | null;
  shuffle_state: boolean;
  /** API: off | track | context */
  repeat_state: 'off' | 'track' | 'context' | string;
}

export interface SpotifyPlaybackTrack {
  id: string;
  name: string;
  duration_ms: number;
  uri: string;
  type: string;
  artists?: { name: string }[];
  album?: {
    name: string;
    images?: { url: string }[];
  };
}

export interface SpotifyWebPlaybackError {
  message: string;
}

declare global {
  interface Window {
    Spotify?: SpotifyPlayerConstructor;
    /** Chamado pelo script sdk.scdn.co quando `Spotify.Player` fica disponível */
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

interface SpotifyPlayerConstructor {
  Player: new (options: {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }) => SpotifyPlayerInstance;
}

export interface SpotifyPlayerInstance {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener(
    event: 'ready' | 'not_ready',
    cb: (d: { device_id: string }) => void,
  ): void;
  addListener(
    event: 'initialization_error' | 'authentication_error' | 'account_error',
    cb: (d: SpotifyWebPlaybackError) => void,
  ): void;
  removeListener(event: string, cb?: unknown): void;
}

export {};
