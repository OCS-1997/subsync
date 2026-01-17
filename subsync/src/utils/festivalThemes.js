/**
 * Festival Theme Configuration
 * Defines date ranges and UI attributes for various Indian festivals.
 * 
 * Supports dynamic dates for lunar/variable festivals via the 'dates' object.
 * Format for dates: { [year]: { start: { month: 0-11, day: 1-31 }, end: { month: 0-11, day: 1-31 } } }
 */

const festivals = [
    {
        id: 'new-year',
        name: 'New Year',
        start: { month: 0, day: 1 }, // Jan 1 (Fixed)
        end: { month: 0, day: 1 },
        wish: 'Happy New Year!',
        subWish: 'Start your year with organized excellence and new heights of success.',
        colors: {
            bg: 'bg-indigo-900',
            accent: 'text-indigo-200',
            button: 'bg-indigo-600 hover:bg-indigo-700',
            glow: 'bg-indigo-400/20'
        },
        icons: ['Sparkles', 'PartyPopper']
    },
    {
        id: 'lohri',
        name: 'Lohri',
        start: { month: 0, day: 13 }, // Jan 13 (Fixed)
        end: { month: 0, day: 13 },
        wish: 'Happy Lohri!',
        subWish: 'May the fire of Lohri bring warmth, prosperity, and joy to your life.',
        colors: {
            bg: 'bg-orange-800',
            accent: 'text-orange-200',
            button: 'bg-orange-600 hover:bg-orange-700',
            glow: 'bg-yellow-400/20'
        },
        icons: ['Flame', 'Sun']
    },
    {
        id: 'pongal',
        name: 'Pongal',
        start: { month: 0, day: 14 }, // Jan 14 (Usually fixed)
        end: { month: 0, day: 17 },
        wish: 'Happy Pongal!',
        subWish: 'May this harvest festival bring abundance and prosperity to your endeavors.',
        colors: {
            bg: 'bg-yellow-800',
            accent: 'text-green-200',
            button: 'bg-yellow-600 hover:bg-yellow-700',
            glow: 'bg-orange-400/20'
        },
        icons: ['Sun', 'Wheat']
    },
    {
        id: 'republic-day',
        name: 'Republic Day',
        start: { month: 0, day: 26 }, // Jan 26 (Fixed)
        end: { month: 0, day: 26 },
        wish: 'Happy Republic Day!',
        subWish: 'Celebrating the spirit of India and the power of our organization.',
        colors: {
            bg: 'bg-orange-700',
            accent: 'text-green-200',
            button: 'bg-orange-500 hover:bg-orange-600',
            glow: 'bg-blue-400/20'
        },
        icons: ['Flag', 'Shield']
    },
    {
        id: 'maha-shivaratri',
        name: 'Maha Shivaratri',
        start: { month: 1, day: 18 }, // Fallback
        dates: {
            2025: { start: { month: 1, day: 26 }, end: { month: 1, day: 26 } },
            2026: { start: { month: 1, day: 15 }, end: { month: 1, day: 15 } },
            2027: { start: { month: 2, day: 6 }, end: { month: 2, day: 6 } }
        },
        end: { month: 1, day: 18 },
        wish: 'Happy Maha Shivaratri!',
        subWish: 'May Lord Shiva bless you with strength, wisdom, and success.',
        colors: {
            bg: 'bg-indigo-800',
            accent: 'text-blue-200',
            button: 'bg-indigo-600 hover:bg-indigo-700',
            glow: 'bg-purple-400/20'
        },
        icons: ['Moon', 'Star']
    },
    {
        id: 'holi',
        name: 'Holi',
        start: { month: 2, day: 4 }, // Fallback
        dates: {
            2025: { start: { month: 2, day: 14 }, end: { month: 2, day: 15 } },
            2026: { start: { month: 2, day: 4 }, end: { month: 2, day: 5 } },
            2027: { start: { month: 2, day: 22 }, end: { month: 2, day: 23 } }
        },
        end: { month: 2, day: 5 },
        wish: 'Happy Holi!',
        subWish: 'Adding vibrant colors of success and collaboration to your workflow.',
        colors: {
            bg: 'bg-purple-700',
            accent: 'text-yellow-200',
            button: 'bg-pink-500 hover:bg-pink-600',
            glow: 'bg-cyan-400/20'
        },
        icons: ['Palette', 'Droplets']
    },
    {
        id: 'ugadi',
        name: 'Ugadi',
        start: { month: 2, day: 22 }, // Fallback
        dates: {
            2025: { start: { month: 2, day: 30 }, end: { month: 2, day: 30 } },
            2026: { start: { month: 2, day: 19 }, end: { month: 2, day: 19 } },
            2027: { start: { month: 3, day: 7 }, end: { month: 3, day: 7 } }
        },
        end: { month: 2, day: 22 },
        wish: 'Happy Ugadi!',
        subWish: 'Wishing you a prosperous Telugu New Year filled with new beginnings.',
        colors: {
            bg: 'bg-teal-800',
            accent: 'text-yellow-200',
            button: 'bg-teal-600 hover:bg-teal-700',
            glow: 'bg-green-400/20'
        },
        icons: ['Sunrise', 'Leaf']
    },
    {
        id: 'ram-navami',
        name: 'Ram Navami',
        start: { month: 3, day: 2 }, // Fallback
        dates: {
            2025: { start: { month: 3, day: 6 }, end: { month: 3, day: 6 } },
            2026: { start: { month: 2, day: 27 }, end: { month: 2, day: 27 } },
            2027: { start: { month: 3, day: 15 }, end: { month: 3, day: 15 } }
        },
        end: { month: 3, day: 2 },
        wish: 'Happy Ram Navami!',
        subWish: 'May Lord Rama bless you with righteousness and prosperity.',
        colors: {
            bg: 'bg-orange-800',
            accent: 'text-yellow-200',
            button: 'bg-orange-600 hover:bg-orange-700',
            glow: 'bg-red-400/20'
        },
        icons: ['Crown', 'Sparkles']
    },
    {
        id: 'good-friday',
        name: 'Good Friday',
        start: { month: 3, day: 3 }, // Fallback
        dates: {
            2025: { start: { month: 3, day: 18 }, end: { month: 3, day: 18 } },
            2026: { start: { month: 3, day: 3 }, end: { month: 3, day: 3 } },
            2027: { start: { month: 2, day: 26 }, end: { month: 2, day: 26 } }
        },
        end: { month: 3, day: 3 },
        wish: 'Good Friday',
        subWish: 'Reflecting on sacrifice and renewal for a better tomorrow.',
        colors: {
            bg: 'bg-purple-900',
            accent: 'text-purple-200',
            button: 'bg-purple-700 hover:bg-purple-800',
            glow: 'bg-white/10'
        },
        icons: ['Cross', 'Heart']
    },
    {
        id: 'easter',
        name: 'Easter',
        start: { month: 3, day: 5 }, // Fallback
        dates: {
            2025: { start: { month: 3, day: 20 }, end: { month: 3, day: 20 } },
            2026: { start: { month: 3, day: 5 }, end: { month: 3, day: 5 } },
            2027: { start: { month: 2, day: 28 }, end: { month: 2, day: 28 } }
        },
        end: { month: 3, day: 5 },
        wish: 'Happy Easter!',
        subWish: 'Celebrating hope, renewal, and new opportunities.',
        colors: {
            bg: 'bg-sky-700',
            accent: 'text-yellow-200',
            button: 'bg-sky-600 hover:bg-sky-700',
            glow: 'bg-pink-400/20'
        },
        icons: ['Egg', 'Flower']
    },
    {
        id: 'eid-ul-fitr',
        name: 'Eid ul-Fitr',
        start: { month: 2, day: 30 }, // Fallback
        dates: {
            2025: { start: { month: 2, day: 31 }, end: { month: 3, day: 1 } },
            2026: { start: { month: 2, day: 20 }, end: { month: 2, day: 21 } },
            2027: { start: { month: 2, day: 10 }, end: { month: 2, day: 11 } }
        },
        end: { month: 3, day: 1 },
        wish: 'Eid Mubarak!',
        subWish: 'May this blessed day bring peace, happiness, and prosperity.',
        colors: {
            bg: 'bg-emerald-800',
            accent: 'text-green-200',
            button: 'bg-emerald-600 hover:bg-emerald-700',
            glow: 'bg-yellow-400/20'
        },
        icons: ['Moon', 'Star']
    },
    {
        id: 'buddha-purnima',
        name: 'Buddha Purnima',
        start: { month: 4, day: 12 }, // Fallback
        dates: {
            2025: { start: { month: 4, day: 12 }, end: { month: 4, day: 12 } },
            2026: { start: { month: 4, day: 1 }, end: { month: 4, day: 1 } },
            2027: { start: { month: 4, day: 20 }, end: { month: 4, day: 20 } }
        },
        end: { month: 4, day: 12 },
        wish: 'Happy Buddha Purnima!',
        subWish: 'May you find peace, wisdom, and enlightenment on this sacred day.',
        colors: {
            bg: 'bg-amber-800',
            accent: 'text-orange-200',
            button: 'bg-amber-600 hover:bg-amber-700',
            glow: 'bg-yellow-400/20'
        },
        icons: ['Lotus', 'Peace']
    },
    {
        id: 'eid-ul-adha',
        name: 'Eid ul-Adha',
        start: { month: 5, day: 6 }, // Fallback
        dates: {
            2025: { start: { month: 5, day: 7 }, end: { month: 5, day: 9 } },
            2026: { start: { month: 4, day: 27 }, end: { month: 4, day: 29 } },
            2027: { start: { month: 4, day: 16 }, end: { month: 4, day: 18 } }
        },
        end: { month: 5, day: 8 },
        wish: 'Eid Mubarak!',
        subWish: 'Wishing you and your loved ones a blessed Eid filled with joy.',
        colors: {
            bg: 'bg-teal-800',
            accent: 'text-teal-200',
            button: 'bg-teal-600 hover:bg-teal-700',
            glow: 'bg-green-400/20'
        },
        icons: ['Moon', 'Star']
    },
    {
        id: 'independence-day',
        name: 'Independence Day',
        start: { month: 7, day: 15 }, // Aug 15 (Fixed)
        end: { month: 7, day: 15 },
        wish: 'Happy Independence Day!',
        subWish: 'Towards a free, efficient, and empowered future for your organization.',
        colors: {
            bg: 'bg-emerald-800',
            accent: 'text-orange-200',
            button: 'bg-orange-500 hover:bg-orange-600',
            glow: 'bg-white/10'
        },
        icons: ['Flag', 'Star']
    },
    {
        id: 'janmashtami',
        name: 'Janmashtami',
        start: { month: 7, day: 25 }, // Fallback
        dates: {
            2025: { start: { month: 7, day: 16 }, end: { month: 7, day: 17 } },
            2026: { start: { month: 8, day: 4 }, end: { month: 8, day: 5 } },
            2027: { start: { month: 7, day: 25 }, end: { month: 7, day: 26 } }
        },
        end: { month: 7, day: 26 },
        wish: 'Happy Janmashtami!',
        subWish: 'May Lord Krishna bless you with love, joy, and divine guidance.',
        colors: {
            bg: 'bg-blue-900',
            accent: 'text-yellow-200',
            button: 'bg-blue-700 hover:bg-blue-800',
            glow: 'bg-cyan-400/20'
        },
        icons: ['Feather', 'Music']
    },
    {
        id: 'onam',
        name: 'Onam',
        start: { month: 7, day: 22 }, // Fallback
        dates: {
            2025: { start: { month: 8, day: 5 }, end: { month: 8, day: 10 } },
            2026: { start: { month: 7, day: 26 }, end: { month: 7, day: 30 } },
            2027: { start: { month: 8, day: 12 }, end: { month: 8, day: 15 } }
        },
        end: { month: 7, day: 30 },
        wish: 'Happy Onam!',
        subWish: 'May King Mahabali bless you with prosperity and happiness.',
        colors: {
            bg: 'bg-yellow-700',
            accent: 'text-green-200',
            button: 'bg-yellow-600 hover:bg-yellow-700',
            glow: 'bg-orange-400/20'
        },
        icons: ['Flower', 'Sun']
    },
    {
        id: 'ganesh-chaturthi',
        name: 'Ganesh Chaturthi',
        start: { month: 8, day: 13 }, // Fallback
        dates: {
            2025: { start: { month: 7, day: 27 }, end: { month: 7, day: 29 } },
            2026: { start: { month: 8, day: 14 }, end: { month: 8, day: 16 } },
            2027: { start: { month: 8, day: 4 }, end: { month: 8, day: 6 } }
        },
        end: { month: 8, day: 15 },
        wish: 'Ganpati Bappa Morya!',
        subWish: 'Wishing you a path of wisdom, success, and hurdle-free management.',
        colors: {
            bg: 'bg-red-800',
            accent: 'text-yellow-200',
            button: 'bg-orange-600 hover:bg-orange-700',
            glow: 'bg-yellow-400/20'
        },
        icons: ['Crown', 'Sparkles']
    },
    {
        id: 'gandhi-jayanti',
        name: 'Gandhi Jayanti',
        start: { month: 9, day: 2 }, // Oct 2 (Fixed)
        end: { month: 9, day: 2 },
        wish: 'Remembering the Mahatma',
        subWish: 'Simple values, powerful tools. Building a better future through service.',
        colors: {
            bg: 'bg-slate-700',
            accent: 'text-blue-100',
            button: 'bg-slate-600 hover:bg-slate-800',
            glow: 'bg-blue-400/10'
        },
        icons: ['Glasses', 'Heart']
    },
    {
        id: 'navratri',
        name: 'Navratri',
        start: { month: 9, day: 3 }, // Fallback
        dates: {
            2025: { start: { month: 8, day: 22 }, end: { month: 9, day: 1 } }, // Sep 22 - Oct 1
            2026: { start: { month: 9, day: 11 }, end: { month: 9, day: 19 } },
            2027: { start: { month: 8, day: 30 }, end: { month: 9, day: 9 } }
        },
        end: { month: 9, day: 11 },
        wish: 'Happy Navratri!',
        subWish: 'May Goddess Durga bless you with strength and victory.',
        colors: {
            bg: 'bg-pink-800',
            accent: 'text-yellow-200',
            button: 'bg-pink-600 hover:bg-pink-700',
            glow: 'bg-purple-400/20'
        },
        icons: ['Sword', 'Flower']
    },
    {
        id: 'dussehra',
        name: 'Dussehra',
        start: { month: 9, day: 12 }, // Fallback
        dates: {
            2025: { start: { month: 9, day: 2 }, end: { month: 9, day: 2 } }, // Oct 2
            2026: { start: { month: 9, day: 20 }, end: { month: 9, day: 20 } },
            2027: { start: { month: 9, day: 9 }, end: { month: 9, day: 9 } }
        },
        end: { month: 9, day: 12 },
        wish: 'Happy Dussehra!',
        subWish: 'Celebrating the victory of good over evil and light over darkness.',
        colors: {
            bg: 'bg-red-800',
            accent: 'text-yellow-200',
            button: 'bg-red-600 hover:bg-red-700',
            glow: 'bg-orange-400/20'
        },
        icons: ['Sword', 'Crown']
    },
    {
        id: 'diwali',
        name: 'Diwali',
        start: { month: 10, day: 1 }, // Fallback
        dates: {
            2025: { start: { month: 9, day: 20 }, end: { month: 9, day: 22 } }, // Oct 20
            2026: { start: { month: 10, day: 8 }, end: { month: 10, day: 10 } },
            2027: { start: { month: 9, day: 29 }, end: { month: 9, day: 31 } }
        },
        end: { month: 10, day: 3 },
        wish: 'Happy Diwali!',
        subWish: 'Illuminating your business pipeline with prosperity and growth.',
        colors: {
            bg: 'bg-amber-900',
            accent: 'text-yellow-400',
            button: 'bg-amber-600 hover:bg-amber-700',
            glow: 'bg-orange-400/30'
        },
        icons: ['Lamp', 'Sparkles']
    },
    {
        id: 'guru-nanak-jayanti',
        name: 'Guru Nanak Jayanti',
        start: { month: 10, day: 15 }, // Fallback
        dates: {
            2025: { start: { month: 10, day: 5 }, end: { month: 10, day: 5 } },
            2026: { start: { month: 10, day: 24 }, end: { month: 10, day: 24 } },
            2027: { start: { month: 10, day: 14 }, end: { month: 10, day: 14 } }
        },
        end: { month: 10, day: 15 },
        wish: 'Happy Guru Nanak Jayanti!',
        subWish: 'May Guru Nanak\'s teachings guide you towards truth and prosperity.',
        colors: {
            bg: 'bg-orange-800',
            accent: 'text-blue-200',
            button: 'bg-orange-600 hover:bg-orange-700',
            glow: 'bg-yellow-400/20'
        },
        icons: ['Book', 'Star']
    },
    {
        id: 'christmas',
        name: 'Christmas',
        start: { month: 11, day: 24 }, // Dec 24 (Fixed)
        end: { month: 11, day: 26 },
        wish: 'Merry Christmas!',
        subWish: 'Wishing you joy, peace, and seamless organization this holiday season.',
        colors: {
            bg: 'bg-red-900',
            accent: 'text-green-300',
            button: 'bg-green-700 hover:bg-green-800',
            glow: 'bg-white/10'
        },
        icons: ['Gift', 'TreePine']
    }
];

/**
 * Number of days before the festival starts when the theme should activate.
 * This creates a "pre-festival" buffer for early celebrations.
 */
const DAYS_BEFORE_FESTIVAL = 3;

/**
 * Retrieves the start and end dates for a festival for a specific year.
 * Handles both fixed dates and year-specific overrides.
 */
const getFestivalDates = (festival, year) => {
    let start = festival.start;
    let end = festival.end;

    // Check for year-specific override
    if (festival.dates && festival.dates[year]) {
        start = festival.dates[year].start;
        end = festival.dates[year].end;
    }

    return { start, end };
};

/**
 * Returns the currently active festival based on the date.
 * The theme activates DAYS_BEFORE_FESTIVAL days before the start date
 * and stays active until the end date of the festival.
 * @param {Date} date - The date to check (defaults to now).
 * @returns {Object|null} The active festival theme or null.
 */
export const getActiveFestival = (date = new Date()) => {
    const currentYear = date.getFullYear();
    const currentTime = date.getTime();

    // Limit checks to supported years if strictly required, 
    // but here we allow fallback to prevent errors in 2028+.
    
    return festivals.find(f => {
        const { start, end } = getFestivalDates(f, currentYear);

        if (!start || !end) return false;

        // Calculate the actual start date (with pre-festival buffer)
        // Month is 0-indexed in JS Date and in our config
        const festivalStartDate = new Date(currentYear, start.month, start.day);
        const themeStartDate = new Date(festivalStartDate);
        themeStartDate.setDate(themeStartDate.getDate() - DAYS_BEFORE_FESTIVAL);

        // Calculate the end date (festival ends at the end of the day)
        const festivalEndDate = new Date(currentYear, end.month, end.day, 23, 59, 59, 999);

        // Check if current date falls within the extended range
        // Handle year wraparound (e.g., if a festival spans New Year) if ever needed, 
        // but currently all festivals are same-year.
        return currentTime >= themeStartDate.getTime() && currentTime <= festivalEndDate.getTime();
    }) || null;
};

/**
 * Returns a formatted date string for a festival.
 * @param {Object} festival - The festival object.
 * @param {number} year - The year to use (defaults to current year).
 * @returns {string} Formatted date string (e.g., "Jan 14" or "Jan 14 - 17").
 */
export const getFestivalDateString = (festival, year = new Date().getFullYear()) => {
    if (!festival) return '';

    const { start, end } = getFestivalDates(festival, year);

    // Safety check
    if (!start || !end) return '';

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const startMonth = months[start.month];
    const endMonth = months[end.month];
    const startDay = start.day;
    const endDay = end.day;

    // Single day festival
    if (start.month === end.month && startDay === endDay) {
        return `${startMonth} ${startDay}, ${year}`;
    }

    // Multi-day festival within the same month
    if (start.month === end.month) {
        return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    }

    // Multi-day festival spanning multiple months
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
};
