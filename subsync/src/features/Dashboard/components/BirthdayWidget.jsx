import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Gift, Cake, ChevronRight, Send, PartyPopper, User, Building2, Users, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';

function BirthdayWidget({ data }) {
    const navigate = useNavigate();
    const [sendingWishId, setSendingWishId] = useState(null);

    if (!data) return null;

    const { today = [], upcoming = [] } = data;
    const allBirthdays = [
        ...today.map(b => ({ ...b, isToday: true })),
        ...upcoming.map(b => ({ ...b, isToday: false }))
    ];

    const sendWish = async (e, person) => {
        e.stopPropagation();
        try {
            setSendingWishId(person.id || person.name); // Using name as fallback if ID is missing (manual entries from model might not have IDs if they are temporary)
            await api.post(`/birthdays/${person.id}/wish`);
            toast.success(`Birthday wish sent to ${person.name}! 🎉`);
        } catch (error) {
            toast.error('Failed to send wish: ' + (error.response?.data?.error || 'Maybe sync birthdays first?'));
        } finally {
            setSendingWishId(null);
        }
    };

    if (allBirthdays.length === 0) {
        return (
            <Card className="h-full border-none shadow-sm dark:bg-slate-900/50 backdrop-blur-sm group hover:shadow-md transition-shadow duration-300">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600">
                                <Gift className="h-4 w-4" />
                            </div>
                            <span>Birthdays</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs font-semibold text-slate-500 hover:text-rose-500"
                            onClick={() => navigate('/birthdays')}
                        >
                            View All <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-800/50 mb-3 border border-slate-100 dark:border-slate-800">
                        <Cake className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">No birthdays in the next 7 days.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-none shadow-sm bg-white dark:bg-slate-900 group hover:shadow-xl transition-all duration-500 overflow-hidden relative">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/5 blur-3xl rounded-full group-hover:bg-pink-500/10 transition-colors duration-500" />

            <CardHeader className="pb-3 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 border-b border-rose-50 dark:border-rose-900/20">
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-rose-500/20">
                            <Cake className="h-4 w-4" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                            Birthdays
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 rounded-full text-xs font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                        onClick={() => navigate('/birthdays')}
                    >
                        See All <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                </CardTitle>
            </CardHeader>

            <CardContent className="p-0 overflow-y-auto max-h-[350px] scrollbar-hide">
                <div className="p-3 space-y-2">
                    <AnimatePresence mode="popLayout">
                        {allBirthdays.map((person, idx) => {
                            const isToday = person.isToday;
                            const isSending = sendingWishId === (person.id || person.name);

                            return (
                                <motion.div
                                    key={person.id || person.name + idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => navigate('/birthdays')}
                                    className={`group/item relative flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-300 border
                                        ${isToday
                                            ? 'bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-rose-200 dark:border-rose-800 shadow-sm'
                                            : 'bg-white dark:bg-slate-900/50 border-slate-50 dark:border-slate-800/50 hover:border-rose-100 dark:hover:border-rose-900/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl border-2 shadow-sm transition-transform duration-300 group-hover/item:scale-110 
                                            ${isToday
                                                ? 'bg-white dark:bg-slate-900 border-rose-400 text-rose-500'
                                                : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'
                                            }`}
                                        >
                                            {person.type === 'user' ? <User className="h-4 w-4" /> :
                                                person.type === 'customer' ? <Building2 className="h-4 w-4" /> :
                                                    <Users className="h-4 w-4" />}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                                                {person.name}
                                                {isToday && <PartyPopper className="h-3 w-3 text-rose-500 animate-bounce" />}
                                            </div>
                                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                {person.type === 'user' ? 'Team member' : person.type === 'customer' ? 'Customer' : 'Contact person'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right flex flex-col items-end gap-1.5">
                                        {isToday ? (
                                            <Badge className="bg-rose-500 hover:bg-rose-600 text-[10px] font-black uppercase tracking-tighter px-2 h-5 shadow-sm">
                                                Today!
                                            </Badge>
                                        ) : (
                                            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                                {person.days_until === 1 ? 'Tomorrow' : `In ${person.days_until}d`}
                                            </span>
                                        )}

                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            disabled={isSending}
                                            onClick={(e) => sendWish(e, person)}
                                            className={`h-7 w-7 rounded-lg transition-all duration-300 opacity-0 group-hover/item:opacity-100
                                                ${isToday
                                                    ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-500/20 opacity-100'
                                                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white'
                                                }`}
                                        >
                                            {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                        </Button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </CardContent>

            {/* Bottom Gradient Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-slate-900 to-transparent pointer-events-none z-10" />
        </Card>
    );
}

export default BirthdayWidget;
