export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).valueOf();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} d ago`;
  }
  return new Date(iso).toLocaleDateString('en-US');
}
