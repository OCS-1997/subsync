/**
 * Calculate the number of working days between two dates, excluding Sundays
 * and optionally excluding specified holidays.
 * @param {Date|string} startDate 
 * @param {Date|string} endDate 
 * @param {Array<string>} holidayDates - Array of date strings in 'YYYY-MM-DD' format
 * @returns {number}
 */
export const calculateWorkingDays = (startDate, endDate, holidayDates = []) => {
    // Helper to safely parse 'YYYY-MM-DD' or ISO as local date instead of UTC
    const parseLocal = (d) => {
        if (!d) return new Date();
        if (d instanceof Date) {
            return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        }
        if (typeof d === 'string') {
            const cleanStr = d.split('T')[0];
            const parts = cleanStr.split('-').map(Number);
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

/**
 * Calculate comprehensive leave duration breakdown between two dates:
 * - totalCalendarDays: total days in range
 * - sundaysCount: number of Sundays in range
 * - holidaysCount: number of public holidays in range
 * - workingDays: net working days deducted
 * - excludedSundays: array of date strings for Sundays in range
 * - excludedHolidays: array of { date: string, name: string } for holidays falling on non-Sundays in range
 * - halfDayType: 'none', 'first_half', 'second_half'
 * 
 * @param {Date|string} startDate 
 * @param {Date|string} endDate 
 * @param {Array<Object|string>} holidays - Array of holiday objects ({holiday_date, name}) or strings
 * @param {string} halfDayType 
 * @returns {Object}
 */
export const calculateLeaveDurationDetails = (startDate, endDate, holidays = [], halfDayType = 'none') => {
    const parseLocal = (d) => {
        if (!d) return new Date();
        if (d instanceof Date) {
            return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        }
        if (typeof d === 'string') {
            const cleanStr = d.split('T')[0];
            const parts = cleanStr.split('-').map(Number);
            if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        return new Date(d);
    };

    let start = parseLocal(startDate);
    let end = parseLocal(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start > end) {
        return {
            totalCalendarDays: 0,
            workingDays: 0,
            sundaysCount: 0,
            holidaysCount: 0,
            excludedSundays: [],
            excludedHolidays: [],
            halfDayType
        };
    }

    const holidayMap = new Map();
    for (const h of holidays) {
        if (!h) continue;
        let dateStr = null;
        let name = 'Public Holiday';
        if (typeof h === 'string') {
            dateStr = h.split('T')[0];
        } else if (typeof h === 'object') {
            const rawDate = h.holiday_date || h.date;
            if (rawDate) {
                if (typeof rawDate === 'string') {
                    dateStr = rawDate.split('T')[0];
                } else if (rawDate instanceof Date) {
                    const y = rawDate.getFullYear();
                    const m = String(rawDate.getMonth() + 1).padStart(2, '0');
                    const d = String(rawDate.getDate()).padStart(2, '0');
                    dateStr = `${y}-${m}-${d}`;
                }
            }
            if (h.name) name = h.name;
            else if (h.holiday_name) name = h.holiday_name;
        }
        if (dateStr) {
            holidayMap.set(dateStr, name);
        }
    }

    let totalCalendarDays = 0;
    let rawWorkingDays = 0;
    const excludedSundays = [];
    const excludedHolidays = [];

    let current = new Date(start);
    while (current <= end) {
        totalCalendarDays++;
        const dayOfWeek = current.getDay();
        const dateString = current.getFullYear() + '-' + 
            String(current.getMonth() + 1).padStart(2, '0') + '-' + 
            String(current.getDate()).padStart(2, '0');

        if (dayOfWeek === 0) {
            // Sunday is non-working
            excludedSundays.push(dateString);
        } else if (holidayMap.has(dateString)) {
            // Public Holiday on a working day
            excludedHolidays.push({
                date: dateString,
                name: holidayMap.get(dateString)
            });
        } else {
            rawWorkingDays++;
        }

        current.setDate(current.getDate() + 1);
    }

    let workingDays = rawWorkingDays;
    if (halfDayType && halfDayType !== 'none') {
        const isSingleDay = totalCalendarDays === 1;
        if (isSingleDay) {
            workingDays = workingDays > 0 ? 0.5 : 0;
        } else {
            workingDays = Math.max(0, workingDays - 0.5);
        }
    }

    return {
        totalCalendarDays,
        workingDays,
        sundaysCount: excludedSundays.length,
        holidaysCount: excludedHolidays.length,
        excludedSundays,
        excludedHolidays,
        halfDayType
    };
};
