import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
    Search, 
    X, 
    CheckCircle2, 
    User, 
    Building, 
    Users, 
    Mail, 
    Calendar,
    Cake,
    Sparkles,
    Loader2
} from 'lucide-react';
import api from '@/lib/axiosInstance';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export function BirthdayFormDialog({ open, onOpenChange, selectedBirthday, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        date_of_birth: '',
        type: 'contact_person',
        email_send: true,
        include_in_communication: true,
        customer_id: null,
        contact_person_index: null
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Load selected birthday data when editing
    useEffect(() => {
        if (selectedBirthday) {
            // Format date properly for date input (yyyy-MM-dd)
            let formattedDate = '';
            if (selectedBirthday.date_of_birth) {
                try {
                    const date = new Date(selectedBirthday.date_of_birth);
                    formattedDate = format(date, 'yyyy-MM-dd');
                } catch (error) {
                    console.error('Date parsing error:', error);
                    formattedDate = '';
                }
            }

            setFormData({
                name: selectedBirthday.name,
                email: selectedBirthday.email,
                date_of_birth: formattedDate,
                type: selectedBirthday.type || 'contact_person',
                email_send: selectedBirthday.email_send === 1 || selectedBirthday.email_send === true,
                include_in_communication: selectedBirthday.include_in_communication === 1 || selectedBirthday.include_in_communication === true,
                customer_id: selectedBirthday.customer_id || null,
                contact_person_index: selectedBirthday.contact_person_index || null
            });
            setSearchQuery(selectedBirthday.name);
            setSelectedPerson({ name: selectedBirthday.name, type: selectedBirthday.type });
        } else {
            resetForm();
        }
    }, [selectedBirthday]);

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            date_of_birth: '',
            type: 'contact_person',
            email_send: true,
            include_in_communication: true,
            customer_id: null,
            contact_person_index: null
        });
        setSearchQuery('');
        setSearchResults([]);
        setSelectedPerson(null);
        setShowDropdown(false);
    };

    // Debounced search
    useEffect(() => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        if (selectedPerson && selectedPerson.name === searchQuery) {
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setIsSearching(true);
                const response = await api.get('/birthdays/search-people', {
                    params: { q: searchQuery.trim() }
                });
                setSearchResults(response.data.results || []);
                setShowDropdown(true);
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedPerson]);

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                inputRef.current && !inputRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNameChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        setFormData({ ...formData, name: value });
        
        if (selectedPerson) {
            setSelectedPerson(null);
        }
    };

    const handlePersonSelect = (person) => {
        setSelectedPerson(person);
        setSearchQuery(person.name);
        setFormData({
            ...formData,
            name: person.name,
            email: person.email || '',
            date_of_birth: person.date_of_birth || '',
            type: person.type,
            customer_id: person.customer_id || null,
            contact_person_index: person.contact_person_index || null
        });
        setShowDropdown(false);
    };

    const clearSelection = () => {
        setSelectedPerson(null);
        setSearchQuery('');
        setFormData({
            ...formData,
            name: '',
            email: '',
            date_of_birth: '',
            type: 'contact_person',
            customer_id: null,
            contact_person_index: null
        });
        inputRef.current?.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.email || !formData.date_of_birth) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setIsSubmitting(true);
            const data = { ...formData };
            if (selectedBirthday?.id) {
                data.id = selectedBirthday.id;
            }

            await api.post('/birthdays', data);
            toast.success(selectedBirthday ? 'Birthday updated! 🎉' : 'Birthday added! 🎂');
            onSuccess?.();
            onOpenChange(false);
            resetForm();
        } catch (error) {
            console.error('Save error:', error);
            toast.error(error.response?.data?.error || 'Failed to save birthday');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'user': return <User className="h-4 w-4" />;
            case 'customer': return <Building className="h-4 w-4" />;
            case 'contact_person': return <Users className="h-4 w-4" />;
            default: return <User className="h-4 w-4" />;
        }
    };

    const getTypeBadgeColor = (type) => {
        switch (type) {
            case 'user': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'customer': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
            case 'contact_person': return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
        }
    };

    const getTypeName = (type) => {
        switch (type) {
            case 'user': return 'Team';
            case 'customer': return 'Client';
            case 'contact_person': return 'Contact';
            default: return type;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[580px] p-0 overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-rose-50/30 dark:from-slate-900 dark:via-pink-950/10 dark:to-rose-950/10 border-2 border-pink-200/50 dark:border-pink-900/30">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-400/10 via-transparent to-rose-400/10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-300/20 to-rose-300/20 dark:from-pink-700/10 dark:to-rose-700/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative">
                    {/* Header */}
                    <DialogHeader className="px-8 pt-8 pb-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl shadow-lg shadow-pink-500/30">
                                <Cake className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent">
                                    {selectedBirthday ? 'Edit Birthday' : 'Add New Birthday'}
                                </DialogTitle>
                                <DialogDescription className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    Make every celebration special  ✨
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
                        {/* Name Search Field */}
                        <div className="space-y-2 relative">
                            <Label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <Search className="h-4 w-4" />
                                Search or Enter Name
                            </Label>
                            <div className="relative">
                                <Input
                                    ref={inputRef}
                                    id="name"
                                    value={searchQuery}
                                    onChange={handleNameChange}
                                    placeholder="Start typing to search..."
                                    className="h-12 pl-4 pr-12 text-base rounded-xl border-2 border-slate-200 dark:border-slate-800 focus:border-pink-400 dark:focus:border-pink-600 transition-all bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm"
                                    required
                                />
                                <div className="absolute right-3 h-12 top-0 flex items-center justify-center gap-2">
                                    {isSearching && <Loader2 className="h-4 w-4 animate-spin text-pink-500" />}
                                    {selectedPerson && (
                                        <button
                                            type="button"
                                            onClick={clearSelection}
                                            className="flex items-center justify-center w-6 h-6 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                        >
                                            <X className="h-4 w-4 text-slate-500" />
                                        </button>
                                    )}
                                </div>

                                {/* Selected Person Badge */}
                                {selectedPerson && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-2 flex items-center gap-2 text-sm"
                                    >
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                            Selected: {selectedPerson.name}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(selectedPerson.type)}`}>
                                            {getTypeName(selectedPerson.type)}
                                        </span>
                                    </motion.div>
                                )}
                            </div>

                            {/* Dropdown Results */}
                            <AnimatePresence>
                                {showDropdown && searchResults.length > 0 && !selectedPerson && (
                                    <motion.div
                                        ref={dropdownRef}
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border-2 border-pink-200 dark:border-pink-900/50 rounded-2xl shadow-2xl shadow-pink-500/20 overflow-hidden backdrop-blur-sm"
                                    >
                                        <div className="max-h-72 overflow-y-auto">
                                            {searchResults.map((person, index) => (
                                                <button
                                                    key={person.id || `${person.type}-${index}`}
                                                    type="button"
                                                    onClick={() => handlePersonSelect(person)}
                                                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-pink-50 dark:hover:bg-pink-950/20 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 text-left group"
                                                >
                                                    <div className={`p-2 rounded-xl ${getTypeBadgeColor(person.type)} group-hover:scale-110 transition-transform`}>
                                                        {getTypeIcon(person.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                                {person.name}
                                                            </p>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(person.type)}`}>
                                                                {getTypeName(person.type)}
                                                            </span>
                                                        </div>
                                                        {person.company_name && (
                                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 truncate">
                                                                {person.company_name}
                                                            </p>
                                                        )}
                                                        {person.email && (
                                                            <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                                                                {person.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                                {showDropdown && searchResults.length === 0 && !isSearching && searchQuery.length >= 2 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute z-50 w-full mt-2 p-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl shadow-lg text-center text-sm text-slate-500"
                                    >
                                        No results found. Continue to add manually.
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Email & DOB Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <Mail className="h-4 w-4" />
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@example.com"
                                    className="h-11 rounded-xl border-2 border-slate-200 dark:border-slate-800 focus:border-pink-400 dark:focus:border-pink-600 bg-white/80 dark:bg-slate-950/80"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date_of_birth" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <Calendar className="h-4 w-4" />
                                    Date of Birth
                                </Label>
                                <Input
                                    id="date_of_birth"
                                    type="date"
                                    value={formData.date_of_birth}
                                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                    className="h-11 rounded-xl border-2 border-slate-200 dark:border-slate-800 focus:border-pink-400 dark:focus:border-pink-600 bg-white/80 dark:bg-slate-950/80"
                                    required
                                />
                            </div>
                        </div>

                        {/* Preferences */}
                        <div className="space-y-4 p-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl border-2 border-slate-200/50 dark:border-slate-800/50">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-pink-500" />
                                        Send Birthday Wishes
                                    </Label>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        Automatically send greetings via email
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.email_send}
                                    onCheckedChange={(c) => setFormData({ ...formData, email_send: c })}
                                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-500 data-[state=checked]:to-rose-500"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 hover:from-pink-600 hover:via-rose-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 transition-all text-base"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Cake className="h-5 w-5 mr-2" />
                                    {selectedBirthday ? 'Update Birthday' : 'Save Birthday'}
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
