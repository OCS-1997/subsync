/**
 * Calculate the number of working days between two dates, excluding Sundays
 * and optionally excluding specified holidays.
 * @param {Date|string} startDate 
 * @param {Date|string} endDate 
 * @param {Array<string>} holidayDates - Array of date strings in 'YYYY-MM-DD' format
 * @returns {number}
 */
export const calculateWorkingDays = (startDate, endDate, holidayDates = []) => {
    // Helper to safely parse 'YYYY-MM-DD' as local date instead of UTC
    const parseLocal = (d) => {
        if (d instanceof Date) return d;
        if (typeof d === 'string' && d.includes('-') && !d.includes('T')) {
            const parts = d.split('-').map(Number);
            if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        return new Date(d);
    };

    let start = parseLocal(startDate);
    let end = parseLocal(endDate);
    
    // Set to midnight to avoid time-of-day issues
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    if (start > end) return 0;
    
    let count = 0;
    let current = new Date(start);
    
    while (current <= end) {
        const dayOfWeek = current.getDay();
        // Construct local date string YYYY-MM-DD to match holidayDates
        const dateString = current.getFullYear() + '-' + 
            String(current.getMonth() + 1).padStart(2, '0') + '-' + 
            String(current.getDate()).padStart(2, '0');
        
        const isWeekend = (dayOfWeek === 0); // Only Sunday is a weekend
        const isHoliday = holidayDates.includes(dateString);
        
        if (!isWeekend && !isHoliday) {
            count++;
        }
        
        current.setDate(current.getDate() + 1);
    }
    
    return count;
};
