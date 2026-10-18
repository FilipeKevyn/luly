export function formatDuration(durationMin: number): string {
  const hours = Math.floor(durationMin / 60);
  const minutes = Math.round(durationMin % 60);
  if (hours <= 0) {
    return `${minutes} min`;
  }
  return `${hours}h ${String(minutes).padStart(2, '0')}min`;
}

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(rest).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${minutes}:${paddedSeconds}`;
}

export function formatRemaining(totalSeconds: number): string {
  return `-${formatClock(totalSeconds)}`;
}

export function formatWatched(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${String(minutes % 60).padStart(2, '0')}min`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1).replace('.', ',');
}
