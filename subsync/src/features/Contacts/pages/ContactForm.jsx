import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Save, Lock, Unlock } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CountrySelect } from '@/components/ui/country-select';
import { PageHeader } from '@/components/ui/breadcrumb';
import Hamster from '@/components/animations/Hamster.jsx';
import { createContact, updateContact, fetchContactById, clearCurrentContact, clearError } from '../contactsSlice';

export default function ContactForm() {
    const navigate = useNavigate();
    const { username, id } = useParams();
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();
    const { currentContact, loading, error } = useSelector((state) => state.contacts);

    const isEditing = !!id;
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        salutation: 'Mr.',
        first_name: '',
        last_name: '',
        email: '',
        country_code: '+91',
        phone_number: searchParams.get('prefill_phone') || '',
        company_name: '',
        designation: '',
        domain_id: '',
        domain_free_text: '',
        date_of_birth: '',
        is_private: false,
        notes: ''
    });

    useEffect(() => {
        if (isEditing) {
            dispatch(fetchContactById(id));
        }
        return () => {
            dispatch(clearCurrentContact());
        };
    }, [id, isEditing, dispatch]);

    useEffect(() => {
        if (currentContact && isEditing) {
            setFormData({
                salutation: currentContact.salutation || 'Mr.',
                first_name: currentContact.first_name || '',
                last_name: currentContact.last_name || '',
                email: currentContact.email || '',
                country_code: currentContact.country_code || '+91',
                phone_number: currentContact.phone_number || '',
                company_name: currentContact.company_name || '',
                designation: currentContact.designation || '',
                domain_id: currentContact.domain_id || '',
                domain_free_text: currentContact.domain_free_text || '',
                date_of_birth: currentContact.date_of_birth ? currentContact.date_of_birth.split('T')[0] : '',
                is_private: currentContact.is_private === 1 || currentContact.is_private === true,
                notes: currentContact.notes || ''
            });
        }
    }, [currentContact, isEditing]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearError());
        }
    }, [error, dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (isEditing) {
                await dispatch(updateContact({ id, contactData: formData })).unwrap();
                toast.success('Contact updated successfully!');
            } else {
                await dispatch(createContact(formData)).unwrap();
                toast.success('Contact created successfully!');
            }
            navigate(`/${username}/dashboard/contacts`);
        } catch (err) {
            toast.error(err || `Failed to ${isEditing ? 'update' : 'create'} contact`);
        } finally {
            setSaving(false);
        }
    };

    if (loading && isEditing) {
        return (
            <div className="p-6 flex flex-col justify-center items-center">
                <Hamster />
            </div>
        );
    }

    return (
        <div className="container py-8 max-w mx-auto px-4 md:px-0">
            <div className="mb-6">
                <PageHeader
                    description={isEditing ? 'Update contact information' : 'Add a new contact to your address book'}
                    breadcrumbItems={[
                        { label: 'Contacts', href: `/${username}/dashboard/contacts` },
                        { label: isEditing ? 'Edit Contact' : 'New Contact' }
                    ]}
                />
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-2">
                    {isEditing ? "Edit Contact" : "New Contact"}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                    <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                            Basic Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8 space-y-6">
                        {/* Name */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label htmlFor="salutation" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">
                                    Salutation <span className="text-red-500 font-bold ml-1">*</span>
                                </Label>
                                <Select
                                    value={formData.salutation}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, salutation: value }))}
                                >
                                    <SelectTrigger className="h-11 rounded-xl px-4 text-sm font-bold bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                        <SelectItem value="Mr." className="text-xs font-bold">Mr.</SelectItem>
                                        <SelectItem value="Ms." className="text-xs font-bold">Ms.</SelectItem>
                                        <SelectItem value="Mrs." className="text-xs font-bold">Mrs.</SelectItem>
                                        <SelectItem value="Dr." className="text-xs font-bold">Dr.</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="first_name" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">
                                    First Name <span className="text-red-500 font-bold ml-1">*</span>
                                </Label>
                                <Input
                                    id="first_name"
                                    type="text"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                                    required
                                    className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white mt-1"
                                    placeholder="Enter first name"
                                />
                            </div>
                            <div>
                                <Label htmlFor="last_name" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Last Name</Label>
                                <Input
                                    id="last_name"
                                    type="text"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                                    className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white mt-1"
                                    placeholder="Enter last name"
                                />
                            </div>
                        </div>

                        {/* Email & Designation */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white mt-1"
                                    placeholder="contact@example.com"
                                />
                            </div>
                            <div>
                                <Label htmlFor="designation" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Designation</Label>
                                <Input
                                    id="designation"
                                    type="text"
                                    value={formData.designation}
                                    onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                                    className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white mt-1"
                                    placeholder="e.g., Manager, CEO"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50 dark:border-slate-800/50">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-3 block">Phone Number</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <Label htmlFor="country_code" className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-600 mb-1">Country Code</Label>
                                    <CountrySelect
                                        value={formData.country_code}
                                        onChange={(value) => setFormData(prev => ({ ...prev, country_code: value }))}
                                        className="h-11 rounded-xl bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 mt-1"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label htmlFor="phone_number" className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-600 mb-1">Number</Label>
                                    <Input
                                        id="phone_number"
                                        type="text"
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                                        className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white mt-1"
                                        placeholder="Enter phone number"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Company & Domain */}
                <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                    <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Company & Domain Details</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <Label htmlFor="company_name" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Company Name</Label>
                                <Input
                                    id="company_name"
                                    type="text"
                                    value={formData.company_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                                    className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white mt-1"
                                    placeholder="Enter company name"
                                />
                            </div>
                            <div>
                                <Label htmlFor="domain_free_text" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Domain</Label>
                                <Input
                                    id="domain_free_text"
                                    type="text"
                                    value={formData.domain_free_text}
                                    onChange={(e) => setFormData(prev => ({ ...prev, domain_free_text: e.target.value }))}
                                    className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white mt-1"
                                    placeholder="e.g., example.com"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Personal Information */}
                <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                    <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Personal Information</CardTitle>
                        <CardDescription className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-1">Date of birth and privacy settings</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8 space-y-8">
                        {/* Date of Birth */}
                        <div>
                            <Label htmlFor="date_of_birth" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Date of Birth</Label>
                            <div className="mt-1">
                                <Input
                                    type="date"
                                    id="date_of_birth"
                                    value={formData.date_of_birth || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                                    className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                                />
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-2 px-1">Used for birthday reminders</p>
                        </div>

                        {/* Privacy Setting */}
                        <div className="flex items-center justify-between p-6 bg-gray-50/50 dark:bg-slate-800/20 border border-gray-100 dark:border-slate-800/50 rounded-2xl transition-all hover:bg-white dark:hover:bg-slate-800/40">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${formData.is_private ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 'bg-green-100 text-green-600 dark:bg-green-900/30'}`}>
                                        {formData.is_private ? (
                                            <Lock className="w-5 h-5" />
                                        ) : (
                                            <Unlock className="w-5 h-5" />
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="is_private" className="text-sm font-black text-gray-900 dark:text-white cursor-pointer block">
                                            {formData.is_private ? 'Private Contact' : 'Public Contact'}
                                        </Label>
                                        <p className="text-[10px] font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest mt-1">
                                            {formData.is_private
                                                ? 'Only you can see this contact'
                                                : 'All users can see this contact'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <Switch
                                id="is_private"
                                checked={formData.is_private}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_private: checked }))}
                                className="data-[state=checked]:bg-orange-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Notes */}
                <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                    <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">Additional Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            rows={4}
                            className="resize-none rounded-2xl p-4 font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                            placeholder="Enter any additional notes about this contact..."
                        />
                    </CardContent>
                </Card>

                {/* Submit Buttons */}
                <div className="flex justify-end items-center gap-4 pt-4 pb-12">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(`/${username}/dashboard/contacts`)}
                        className="h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all font-bold"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 h-11 px-10 rounded-xl font-black uppercase tracking-widest text-[10px] text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="flex items-center">
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                Saving...
                            </div>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                {isEditing ? 'Update Contact' : 'Create Contact'}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
