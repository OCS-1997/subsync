import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CountrySelect } from '@/components/ui/country-select';
import Hamster from '@/components/animations/Hamster.jsx';
import { createContact, updateContact, fetchContactById, clearCurrentContact, clearError } from '../contactsSlice';

export default function ContactForm() {
    const navigate = useNavigate();
    const { username, id } = useParams();
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
        phone_number: '',
        company_name: '',
        designation: '',
        domain_id: '',
        domain_free_text: '',
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
        <div className="p-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/${username}/dashboard/contacts`)}
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    Dashboard / Contacts / {isEditing ? 'Edit Contact' : 'New Contact'}
                </span>
            </div>

            {/* Header */}
            <h1 className="text-2xl font-bold mb-6 dark:text-white">
                {isEditing ? 'Edit Contact' : 'New Contact'}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader className="border-b">
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {/* Name */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="salutation">
                                    Salutation <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.salutation}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, salutation: value }))}
                                >
                                    <SelectTrigger className="mt-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Mr.">Mr.</SelectItem>
                                        <SelectItem value="Ms.">Ms.</SelectItem>
                                        <SelectItem value="Mrs.">Mrs.</SelectItem>
                                        <SelectItem value="Dr.">Dr.</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="first_name">
                                    First Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="first_name"
                                    type="text"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                                    required
                                    className="mt-2"
                                    placeholder="Enter first name"
                                />
                            </div>
                            <div>
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input
                                    id="last_name"
                                    type="text"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                                    className="mt-2"
                                    placeholder="Enter last name"
                                />
                            </div>
                        </div>

                        {/* Email & Designation */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="mt-2"
                                    placeholder="contact@example.com"
                                />
                            </div>
                            <div>
                                <Label htmlFor="designation">Designation</Label>
                                <Input
                                    id="designation"
                                    type="text"
                                    value={formData.designation}
                                    onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                                    className="mt-2"
                                    placeholder="e.g., Manager, CEO"
                                />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <Label className="mb-2">Phone Number</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="country_code" className="text-sm">Country Code</Label>
                                    <CountrySelect
                                        value={formData.country_code}
                                        onChange={(value) => setFormData(prev => ({ ...prev, country_code: value }))}
                                        className="mt-1"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label htmlFor="phone_number" className="text-sm">Phone Number</Label>
                                    <Input
                                        id="phone_number"
                                        type="text"
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                                        className="mt-1"
                                        placeholder="Enter phone number"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Company & Domain */}
                <Card>
                    <CardHeader className="border-b">
                        <CardTitle>Company & Domain Details</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="company_name">Company Name</Label>
                                <Input
                                    id="company_name"
                                    type="text"
                                    value={formData.company_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                                    className="mt-2"
                                    placeholder="Enter company name"
                                />
                            </div>
                            <div>
                                <Label htmlFor="domain_free_text">Domain</Label>
                                <Input
                                    id="domain_free_text"
                                    type="text"
                                    value={formData.domain_free_text}
                                    onChange={(e) => setFormData(prev => ({ ...prev, domain_free_text: e.target.value }))}
                                    className="mt-2"
                                    placeholder="e.g., example.com"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                    <CardHeader className="border-b">
                        <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            rows={4}
                            className="resize-none"
                            placeholder="Enter any additional notes about this contact..."
                        />
                    </CardContent>
                </Card>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pb-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(`/${username}/dashboard/contacts`)}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : isEditing ? 'Update Contact' : 'Create Contact'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
