import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';
import { Save } from 'lucide-react';

const ROLES = ['admin', 'manager', 'sales', 'support', 'viewer'];

function AdminWidgetPermissions() {
    const [widgets, setWidgets] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [widgetsRes, permissionsRes] = await Promise.all([
                api.get('/dashboard/widgets'),
                api.get('/dashboard/widgets/permissions')
            ]);

            setWidgets(widgetsRes.data);

            // Build permissions matrix
            const matrix = {};
            widgetsRes.data.forEach(widget => {
                matrix[widget.widget_key] = {};
                ROLES.forEach(role => {
                    const perm = permissionsRes.data.find(
                        p => p.widget_key === widget.widget_key && p.role === role
                    );
                    matrix[widget.widget_key][role] = perm ? perm.is_visible === 1 : false;
                });
            });
            setPermissions(matrix);
        } catch (error) {
            console.error('Error loading widget permissions:', error);
            toast.error(error.normalizedMessage || 'Failed to load widget permissions');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (widgetKey, role) => {
        setPermissions(prev => ({
            ...prev,
            [widgetKey]: {
                ...prev[widgetKey],
                [role]: !prev[widgetKey]?.[role]
            }
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updates = [];

            Object.keys(permissions).forEach(widgetKey => {
                ROLES.forEach(role => {
                    // Admin always sees all widgets, so skip admin role
                    if (role === 'admin') return;

                    updates.push({
                        role,
                        widget_key: widgetKey,
                        is_visible: permissions[widgetKey][role] ? 1 : 0
                    });
                });
            });

            await api.post('/dashboard/widgets/permissions', { updates });
            toast.success('Widget permissions updated successfully');
        } catch (error) {
            console.error('Error saving widget permissions:', error);
            toast.error(error.normalizedMessage || 'Failed to save widget permissions');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Loading...</CardTitle>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Widget Permissions Management</CardTitle>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Configure which widgets are visible to each role. Admin role always sees all widgets.
                    </p>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Widget</TableHead>
                                    {ROLES.map(role => (
                                        <TableHead key={role} className="text-center capitalize">
                                            {role === 'admin' ? `${role}*` : role}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {widgets.map(widget => (
                                    <TableRow key={widget.widget_key}>
                                        <TableCell className="font-medium">
                                            <div>
                                                <div>{widget.name}</div>
                                                <div className="text-xs text-muted-foreground">{widget.description}</div>
                                            </div>
                                        </TableCell>
                                        {ROLES.map(role => (
                                            <TableCell key={role} className="text-center">
                                                {role === 'admin' ? (
                                                    <Checkbox checked={true} disabled />
                                                ) : (
                                                    <Checkbox
                                                        checked={permissions[widget.widget_key]?.[role] || false}
                                                        onCheckedChange={() => handleToggle(widget.widget_key, role)}
                                                    />
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <p className="text-xs text-muted-foreground mt-4">
                        * Admin role always has access to all widgets and cannot be modified.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default AdminWidgetPermissions;

