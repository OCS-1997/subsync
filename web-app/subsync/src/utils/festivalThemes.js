/**
 * Festival Theme Configuration
 * Defines date ranges and UI attributes for various Indian festivals.
 */

const festivals = [
    {
        id: 'new-year',
        name: 'New Year',
        start: { month: 0, day: 1 }, // Jan 1
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
        start: { month: 0, day: 13 }, // Jan 13
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
        start: { month: 0, day: 14 }, // Jan 14-17 (2026)
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
        start: { month: 0, day: 26 }, // Jan 26
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
        start: { month: 1, day: 18 }, // Feb 18 (2026)
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
        start: { month: 2, day: 3 }, // Mar 4 (2026)
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
        start: { month: 2, day: 22 }, // Mar 22 (2026)
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
        start: { month: 3, day: 2 }, // Apr 2 (2026)
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
        start: { month: 3, day: 3 }, // Apr 3 (2026)
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
        start: { month: 3, day: 5 }, // Apr 5 (2026)
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
        start: { month: 2, day: 30 }, // Mar 30 (2026 estimated)
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
        start: { month: 4, day: 12 }, // May 12 (2026)
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
        start: { month: 5, day: 6 }, // Jun 6 (2026 estimated)
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
        start: { month: 7, day: 15 }, // Aug 15
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
        start: { month: 7, day: 25 }, // Aug 25 (2026)
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
        start: { month: 7, day: 22 }, // Aug 22-30 (2026)
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
        start: { month: 8, day: 13 }, // Sep 14 (2026)
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
        start: { month: 9, day: 2 }, // Oct 2
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
        start: { month: 9, day: 3 }, // Oct 3-11 (2026)
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
        start: { month: 9, day: 12 }, // Oct 12 (2026)
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
        start: { month: 10, day: 1 }, // Nov 1 (2026)
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
        start: { month: 10, day: 15 }, // Nov 15 (2026)
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
        start: { month: 11, day: 24 }, // Dec 24-26
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
 * Returns the currently active festival based on the date.
 * @param {Date} date - The date to check (defaults to now).
 * @returns {Object|null} The active festival theme or null.
 */
export const getActiveFestival = (date = new Date()) => {
    const month = date.getMonth();
    const day = date.getDate();

    return festivals.find(f => {
        // Exact day check
        if (f.start.month === f.end.month && f.start.day === f.end.day) {
            return month === f.start.month && day === f.start.day;
        }

        // Range check (simplified for within same year)
        const startDate = new Date(date.getFullYear(), f.start.month, f.start.day);
        const endDate = new Date(date.getFullYear(), f.end.month, f.end.day);
        const currentDate = new Date(date.getFullYear(), month, day);

        return currentDate >= startDate && currentDate <= endDate;
    }) || null;
};
