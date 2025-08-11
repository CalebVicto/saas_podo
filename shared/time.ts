export const TIME_ZONE = 'America/Lima';
export const LOCALE = 'es-PE';

export const todayISODate = (): string => {
  const now = new Date();
  const lima = new Date(now.toLocaleString('en-US', { timeZone: TIME_ZONE }));
  const year = lima.getFullYear();
  const month = String(lima.getMonth() + 1).padStart(2, '0');
  const day = String(lima.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString(LOCALE, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: TIME_ZONE,
      })
    : '—';

export const formatTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleTimeString(LOCALE, {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: TIME_ZONE,
      })
    : '—';
