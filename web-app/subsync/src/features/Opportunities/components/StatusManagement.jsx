import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "react-toastify";

import { fetchStatuses } from "../opportunitySlice.js";
import opportunityService from "../services/opportunityService.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { cn } from "@/lib/utils";

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
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Status Pipeline</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Configure Stage Sequences</p>
                </div>
                {!isAdding && !editingId && (
                    <Button
                        size="sm"
                        onClick={() => setIsAdding(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 h-10 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Stage
                    </Button>
                )}
            </div>

            <div className="space-y-3">
                {isAdding && (
                    <div className="flex items-center gap-4 p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="w-12 flex justify-center">
                            <input
                                type="color"
                                value={statusForm.status_color}
                                onChange={(e) => setStatusForm({ ...statusForm, status_color: e.target.value })}
                                className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                            />
                        </div>
                        <Input
                            placeholder="Enter stage name..."
                            value={statusForm.status_name}
                            onChange={(e) => setStatusForm({ ...statusForm, status_name: e.target.value })}
                            className="flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-10 rounded-xl font-bold"
                        />
                        <div className="w-24">
                            <Input
                                type="number"
                                placeholder="Order"
                                value={statusForm.sort_order}
                                onChange={(e) => setStatusForm({ ...statusForm, sort_order: parseInt(e.target.value) || 0 })}
                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-10 rounded-xl font-bold text-center"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleSave(null)} className="h-10 w-10 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl">
                                <Check className="h-5 w-5" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={cancelEdit} className="h-10 w-10 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-2">
                    {(statuses || []).map((status) => (
                        <div
                            key={status.id}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-2xl border transition-all duration-300",
                                editingId === status.id
                                    ? "bg-white dark:bg-slate-900 border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02] z-10"
                                    : "bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                            )}
                        >
                            {editingId === status.id ? (
                                <div className="flex flex-1 items-center gap-4">
                                    <div className="w-12 flex justify-center">
                                        <input
                                            type="color"
                                            value={statusForm.status_color}
                                            onChange={(e) => setStatusForm({ ...statusForm, status_color: e.target.value })}
                                            className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                                        />
                                    </div>
                                    <Input
                                        className="flex-1 bg-slate-50 dark:bg-slate-800/50 border-none h-10 rounded-xl font-bold"
                                        value={statusForm.status_name}
                                        onChange={(e) => setStatusForm({ ...statusForm, status_name: e.target.value })}
                                    />
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            className="bg-slate-50 dark:bg-slate-800/50 border-none h-10 rounded-xl font-bold text-center"
                                            value={statusForm.sort_order}
                                            onChange={(e) => setStatusForm({ ...statusForm, sort_order: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" onClick={() => handleSave(status.id)} className="h-10 w-10 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl">
                                            <Check className="h-5 w-5" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={cancelEdit} className="h-10 w-10 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-6">
                                        <div className="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-black text-slate-400">
                                            {String(status.sort_order).padStart(2, '0')}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: status.status_color }} />
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{status.status_name}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleEdit(status)}
                                            className="h-10 w-10 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-all"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleDelete(status.id)}
                                            className="h-10 w-10 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StatusManagement;
