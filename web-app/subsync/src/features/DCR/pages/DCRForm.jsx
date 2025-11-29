import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/axiosInstance.js';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';

const DCR_CATEGORIES = [
    'Domain', 'Email Issue', 'GWS', 'M365', 'SSL', 'Hosting',
    'Cloud Hosting', 'Website', 'Payments', 'Renewal Followup',
    'Digital Marketing', 'Enquiry', 'Others'
];

const DCRForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isEditing = !!location.state?.entry;
    const entry = location.state?.entry || null;

    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState(DCR_CATEGORIES);
    const [form, setForm] = useState({
        timestamp: new Date().toISOString().slice(0, 16),
        company: '',
        domain: '',
        contact_person: '',
        call_type: 'Inbound',
        category: '',
        contact_number: '',
        description: '',
        time_spent: '00:00'
    });

    useEffect(() => {
        if (isEditing && entry) {
            const entryDate = new Date(entry.timestamp);
            const hours = Math.floor(entry.time_spent_minutes / 60);
            const minutes = entry.time_spent_minutes % 60;
            setForm({
                timestamp: entryDate.toISOString().slice(0, 16),
                company: entry.company || '',
                domain: entry.domain || '',
                contact_person: entry.contact_person || '',
                call_type: entry.call_type || 'Inbound',
                category: entry.category || '',
                contact_number: entry.contact_number || '',
                description: entry.description || '',
                time_spent: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
            });
        }
    }, [isEditing, entry]);

    useEffect(() => {
        // Load categories from API
        api.get('/dcr/categories')
            .then(res => {
                if (res.data && res.data.length > 0) {
                    setCategories(res.data);
                }
            })
            .catch(() => {
                // Use default categories if API fails
            });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const validateTimeFormat = (time) => {
        const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return regex.test(time);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.category) {
            toast.error('Please select a category');
            return;
        }

        if (!validateTimeFormat(form.time_spent)) {
            toast.error('Please enter time in HH:MM format (e.g., 01:30)');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...form,
                timestamp: new Date(form.timestamp).toISOString().slice(0, 19).replace('T', ' ')
            };

            if (isEditing) {
                await api.put(`/dcr/${entry.id}`, payload);
                toast.success('DCR entry updated successfully');
            } else {
                await api.post('/dcr', payload);
                toast.success('DCR entry created successfully');
            }

            const username = location.pathname.split('/')[1];
            // Redirect to DCR list - PermissionGate will handle access control
            setTimeout(() => navigate(`/${username}/dashboard/dcr`), 1500);
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to save DCR entry');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        const username = location.pathname.split('/')[1];
        navigate(`/${username}/dashboard/dcr`);
    };

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">
                    {isEditing ? 'Edit DCR Entry' : 'New DCR Entry'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="timestamp">Timestamp *</Label>
                        <Input
                            id="timestamp"
                            name="timestamp"
                            type="datetime-local"
                            value={form.timestamp}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="call_type">Call Type *</Label>
                        <Select value={form.call_type} onValueChange={(value) => handleSelectChange('call_type', value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Inbound">Inbound</SelectItem>
                                <SelectItem value="Outbound">Outbound</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="category">Category *</Label>
                        <Select value={form.category} onValueChange={(value) => handleSelectChange('category', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="time_spent">Time Spent (HH:MM) *</Label>
                        <Input
                            id="time_spent"
                            name="time_spent"
                            type="text"
                            placeholder="01:30"
                            value={form.time_spent}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="company">Company</Label>
                        <Input
                            id="company"
                            name="company"
                            value={form.company}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <Label htmlFor="domain">Domain</Label>
                        <Input
                            id="domain"
                            name="domain"
                            value={form.domain}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <Label htmlFor="contact_person">Contact Person</Label>
                        <Input
                            id="contact_person"
                            name="contact_person"
                            value={form.contact_person}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <Label htmlFor="contact_number">Contact Number</Label>
                        <Input
                            id="contact_number"
                            name="contact_number"
                            value={form.contact_number}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        name="description"
                        rows={4}
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Enter call details..."
                    />
                </div>

                <div className="flex gap-4">
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleBack}>
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default DCRForm;

