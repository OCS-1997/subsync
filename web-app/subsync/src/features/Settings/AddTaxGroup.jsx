import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import api from "@/lib/axiosInstance.js";
import { ArrowLeft } from "lucide-react";

function AddTaxGroup() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [groupName, setGroupName] = useState("");
    const [description, setDescription] = useState("");
    const [allTaxes, setAllTaxes] = useState([]);
    const [selectedTaxIds, setSelectedTaxIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const promises = [api.get('/all-taxes')];
                if (isEditing) promises.push(api.get(`/tax-groups/${id}`));
                const [taxesRes, groupRes] = await Promise.all(promises);
                setAllTaxes(taxesRes.data.taxes || []);
                if (isEditing && groupRes) {
                    const g = groupRes.data.group;
                    setGroupName(g.group_name || "");
                    setDescription(g.description || "");
                    setSelectedTaxIds((g.members || []).map(m => m.tax_id));
                }
            } catch (e) {
                setError("Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const toggleTax = (taxId) => {
        setSelectedTaxIds(prev => prev.includes(taxId) ? prev.filter(id => id !== taxId) : [...prev, taxId]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!groupName.trim()) {
            setError('Group name is required');
            return;
        }
        try {
            setLoading(true);
            const payload = { groupName: groupName.trim(), description: description.trim(), taxIds: selectedTaxIds };
            if (isEditing) {
                await api.put(`/tax-groups/${id}`, payload);
                toast.success('Tax group updated!', { position: 'top-right', autoClose: 1500, theme: 'colored', transition: Bounce });
            } else {
                await api.post('/tax-groups', payload);
                toast.success('Tax group created!', { position: 'top-right', autoClose: 1500, theme: 'colored', transition: Bounce });
            }
            setTimeout(() => navigate(-1), 1200);
        } catch (e) {
            toast.error(e?.response?.data?.error || 'Failed to save tax group', { position: 'top-right', autoClose: 2000, theme: 'colored', transition: Bounce });
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        const currentPath = window.location.pathname;
        const userSegment = currentPath.split("/")[1];
        navigate(`/${userSegment}/dashboard/settings/taxes/tax-rates`);
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>Settings</span>
                        <span>{`>`}</span>
                        <span>Taxes</span>
                        <span>{`>`}</span>
                        <span>Tax Groups</span>
                        <span>{`>`}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{isEditing ? 'Edit' : 'New'}</span>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={goBack}
                        className="flex items-center gap-2 w-fit p-0 h-auto text-blue-600 hover:text-blue-700 hover:bg-transparent"
                    >
                        <ArrowLeft size={16} />
                        Back to Taxes
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{isEditing ? 'Edit Tax Group' : 'Add Tax Group'}</CardTitle>
                    <CardDescription>Create a named collection of taxes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="groupName">Group Name <span className="text-red-500">*</span></Label>
                            <Input id="groupName" value={groupName} onChange={(e) => setGroupName(e.target.value)} disabled={loading} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={loading} />
                        </div>

                        <div className="space-y-2">
                            <Label>Select Taxes</Label>
                            <div className="max-h-64 overflow-auto border rounded-md divide-y">
                                {allTaxes.map(tax => (
                                    <label key={tax.tax_id} className="flex items-center gap-3 p-2">
                                        <input type="checkbox" checked={selectedTaxIds.includes(tax.tax_id)} onChange={() => toggleTax(tax.tax_id)} />
                                        <span className="flex-1">{tax.tax_name}</span>
                                        <span className="text-xs text-gray-500">{tax.tax_type} • {tax.tax_rate}%</span>
                                    </label>
                                ))}
                                {allTaxes.length === 0 && (
                                    <div className="p-3 text-sm text-gray-500">No taxes available. Add taxes first.</div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={loading}>Cancel</Button>
                            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : (isEditing ? 'Update Group' : 'Create Group')}</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default AddTaxGroup;


