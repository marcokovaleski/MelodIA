import { logSpotifyPlayer, logSpotifyPlayerError } from '../services/spotifyPlayerLogger';
import type { SpotifyPlayerInstance } from '../types/spotify-web-playback';

const SDK_URL = 'https://sdk.scdn.co/spotify-player.js';

/** Documentação Spotify: o SDK expõe `window.onSpotifyWebPlaybackSDKReady` após o script. */
function ensureSpotifySdkLoaded(): Promise<void> {
  if (window.Spotify?.Player) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const done = () => {
      if (window.Spotify?.Player) resolve();
      else reject(new Error('Spotify SDK carregou mas Spotify.Player não está disponível'));
    };

    const existing = document.querySelector(`script[src="${SDK_URL}"]`);
    if (existing) {
      const prev = window.onSpotifyWebPlaybackSDKReady;
      window.onSpotifyWebPlaybackSDKReady = () => {
        if (typeof prev === 'function') prev();
        done();
      };
      if (window.Spotify?.Player) done();
      return;
    }

    const prev = window.onSpotifyWebPlaybackSDKReady;
    window.onSpotifyWebPlaybackSDKReady = () => {
      if (typeof prev === 'function') prev();
      done();
    };

    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    script.onerror = () => reject(new Error(`Falha ao carregar ${SDK_URL}`));
    document.body.appendChild(script);
  });
}

/**
 * Carrega o Spotify Web Playback SDK e instancia um player no navegador (device_id único).
 */
export async function createBrowserSpotifyPlayer(
  getAccessToken: () => string | Promise<string>,
  playerName = 'MelodIA Web Player',
): Promise<{ deviceId: string; disconnect: () => void; player: SpotifyPlayerInstance }> {
  await ensureSpotifySdkLoaded();

  const Spotify = window.Spotify;
  if (!Spotify?.Player) {
    throw new Error('Spotify Web Playback SDK não disponível após carregar o script');
  }

  const player = new Spotify.Player({
    name: playerName,
    getOAuthToken: (cb) => {
      Promise.resolve(getAccessToken())
        .then((t) => cb(t || ''))
        .catch(() => cb(''));
    },
    volume: 0.85,
  });

  const deviceId = await new Promise<string>((resolve, reject) => {
    const t = window.setTimeout(() => {
      reject(new Error('Timeout ao aguardar device_id do Web Player'));
    }, 25_000);

    player.addListener('ready', ({ device_id }) => {
      window.clearTimeout(t);
      logSpotifyPlayer('info', 'Web Player pronto', { device_id });
      resolve(device_id);
    });

    player.addListener('not_ready', ({ device_id }) => {
      logSpotifyPlayer('warn', 'Web Player não pronto', { device_id });
    });

    player.addListener('initialization_error', ({ message }) => {
      window.clearTimeout(t);
      logSpotifyPlayerError('web_player_init', new Error(message), {});
      reject(new Error(message));
    });

    player.addListener('authentication_error', ({ message }) => {
      logSpotifyPlayerError('web_player_auth', new Error(message), {});
    });

    player.addListener('account_error', ({ message }) => {
      logSpotifyPlayerError('web_player_account', new Error(message), {});
    });

    player.connect().then((ok) => {
      if (!ok) {
        window.clearTimeout(t);
        reject(new Error('Não foi possível conectar ao Web Player'));
      }
    });
  });

  return {
    deviceId,
    player,
    disconnect: () => {
      try {
        player.disconnect();
      } catch {
        /* ignore */
      }
    },
  };
}
