/**
 * Formata duração em milissegundos para string mm:ss.
 *
 * @param {number} ms - Duração em milissegundos
 * @returns {string} Ex.: "3:45", "0:00"
 */
export function formatDuration(ms) {
  if (typeof ms !== 'number' || Number.isNaN(ms) || ms < 0) {
    return '0:00';
  }
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
