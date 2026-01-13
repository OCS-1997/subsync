/**
 * Formats a date string or object to YYYY-MM-DD for MySQL DATE columns
 * @param {string|Date} date - The date to format
 * @returns {string|null} - Formatted date string or null
 */
export const formatMySQLDate = (date) => {
    if (!date) return null;

    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            // If it's not a valid date, but might be a string MySQL can handle
            if (typeof date === 'string' && date.includes('T')) {
                return date.split('T')[0];
            }
            return date;
        }

        // Use YYYY-MM-DD format
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error("Error formatting date for MySQL:", error);
        return date;
    }
};
