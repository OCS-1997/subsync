import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "react-toastify";

import { fetchStatuses } from "../opportunitySlice.js";
import opportunityService from "../services/opportunityService.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";

const StatusManagement = () => {
    const dispatch = useDispatch();
    const { statuses = [] } = useSelector((state) => state.opportunities);
    const [editingId, setEditingId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

    const [statusForm, setStatusForm] = useState({
        status_name: "",
        status_color: "#3b82f6",
        sort_order: 0
    });

    useEffect(() => {
        dispatch(fetchStatuses());
    }, [dispatch]);

    const handleEdit = (status) => {
        setEditingId(status.id);
        setStatusForm({
            status_name: status.status_name,
            status_color: status.status_color,
            sort_order: status.sort_order
        });
    };

    const handleSave = async (id) => {
        try {
            if (id) {
                await opportunityService.updateStatus(id, statusForm);
                toast.success("Status updated");
            } else {
                await opportunityService.createStatus(statusForm);
                toast.success("Status created");
                setIsAdding(false);
            }
            setEditingId(null);
            dispatch(fetchStatuses());
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this status?")) return;
        try {
            await opportunityService.deleteStatus(id);
            toast.success("Status deleted");
            dispatch(fetchStatuses());
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete status");
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setIsAdding(false);
        setStatusForm({ status_name: "", status_color: "#3b82f6", sort_order: 0 });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Status Definitions</CardTitle>
                <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding || !!editingId}>
                    <Plus className="h-4 w-4 mr-2" /> Add Status
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {isAdding && (
                        <div className="flex flex-wrap items-center gap-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                            <div className="flex-1 min-w-[200px]">
                                <Input
                                    placeholder="Status Name"
                                    value={statusForm.status_name}
                                    onChange={(e) => setStatusForm({ ...statusForm, status_name: e.target.value })}
                                />
                            </div>
                            <div className="w-32">
                                <Input
                                    type="color"
                                    value={statusForm.status_color}
                                    onChange={(e) => setStatusForm({ ...statusForm, status_color: e.target.value })}
                                    className="h-10 p-1"
                                />
                            </div>
                            <div className="w-24">
                                <Input
                                    type="number"
                                    placeholder="Order"
                                    value={statusForm.sort_order}
                                    onChange={(e) => setStatusForm({ ...statusForm, sort_order: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button size="icon" variant="ghost" onClick={() => handleSave(null)}>
                                    <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={cancelEdit}>
                                    <X className="h-4 w-4 text-red-600" />
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-2">
                        {(statuses || []).map((status) => (
                            <div
                                key={status.id}
                                className="flex flex-wrap items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                                {editingId === status.id ? (
                                    <div className="flex flex-1 flex-wrap items-center gap-4">
                                        <Input
                                            className="flex-1 min-w-[150px]"
                                            value={statusForm.status_name}
                                            onChange={(e) => setStatusForm({ ...statusForm, status_name: e.target.value })}
                                        />
                                        <Input
                                            type="color"
                                            value={statusForm.status_color}
                                            onChange={(e) => setStatusForm({ ...statusForm, status_color: e.target.value })}
                                            className="w-24 h-10 p-1"
                                        />
                                        <Input
                                            type="number"
                                            className="w-20"
                                            value={statusForm.sort_order}
                                            onChange={(e) => setStatusForm({ ...statusForm, sort_order: parseInt(e.target.value) || 0 })}
                                        />
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => handleSave(status.id)}>
                                                <Check className="h-4 w-4 text-green-600" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={cancelEdit}>
                                                <X className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-4">
                                            <div className="w-6 text-xs text-gray-400 font-mono">{status.sort_order}</div>
                                            <Badge style={{ backgroundColor: status.status_color, color: "white" }}>
                                                {status.status_name}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="icon" variant="ghost" onClick={() => handleEdit(status)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(status.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default StatusManagement;
