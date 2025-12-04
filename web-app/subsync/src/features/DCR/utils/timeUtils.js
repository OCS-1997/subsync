/**
 * Convert HH:MM string to minutes
 * @param {string} timeStr - Format "HH:MM"
 * @returns {number} - Total minutes
 */
export function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Convert minutes to HH:MM string
 * @param {number} minutes
 * @returns {string} - Format "HH:MM"
 */
export function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}


