// Utility functions for displaying dates in a human-friendly format.

// Returns a string like "14:32" from a date
export function formatTimeFromDate(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Returns "Aujourd'hui", "Hier", or a date like "12 jan."
export function formatConversationDateInFrench(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return formatTimeFromDate(date);
  if (isYesterday) return 'Hier';

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

// Returns a full date like "12 janvier 2025"
export function formatFullDateInFrench(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Returns a month + year like "Janvier 2025"
export function formatMonthAndYearInFrench(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
}
