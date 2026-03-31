import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { generatePlaylistViaN8n } from '../services/n8n';

/**
 * Orquestra a geração de playlist (chama o serviço n8n existente).
 * Não altera endpoint, payload nem parsing da resposta — apenas validação local e UX.
 */
export function useGeneratePlaylist() {
  const spotifyToken = useAuthStore((s) => s.accessToken);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const execute = useCallback(
    async (prompt) => {
      const trimmedPrompt = (prompt ?? '').trim();
      setSuccessMessage('');
      setErrorMessage('');

      if (!trimmedPrompt) {
        setErrorMessage('Digite um comando para continuar.');
        console.warn('Prompt vazio - requisição não enviada');
        return null;
      }

      if (!spotifyToken) {
        setErrorMessage('Faça login com Spotify para gerar a playlist.');
        console.warn('Token ausente - requisição não enviada');
        return null;
      }

      const tokenPreview = `${spotifyToken.slice(0, 8)}...`;

      setIsLoading(true);

      console.log('Chamando n8n', {
        prompt: trimmedPrompt,
        spotifyTokenPreview: tokenPreview,
      });

      try {
        const res = await generatePlaylistViaN8n(trimmedPrompt, spotifyToken);
        console.log('Resposta recebida', res);

        if (!res?.success || !res?.playlistId) {
          throw new Error('Resposta inválida do webhook ao gerar playlist.');
        }

        setSuccessMessage('Playlist criada com sucesso!');
        return res;
      } catch (err) {
        setErrorMessage('Erro ao gerar playlist. Tente novamente.');
        console.error('Erro detalhado ao gerar playlist', {
          message: err?.message,
          stack: err?.stack,
          error: err,
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [spotifyToken],
  );

  const clearFeedback = useCallback(() => {
    setSuccessMessage('');
    setErrorMessage('');
  }, []);

  return {
    execute,
    isLoading,
    successMessage,
    errorMessage,
    clearFeedback,
  };
}
