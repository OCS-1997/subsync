import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Pencil, Trash2, Check, X, GripVertical, Settings2, Palette } from "lucide-react";
import { toast } from "react-toastify";

import { fetchStatuses } from "../opportunitySlice.js";
import opportunityService from "../services/opportunityService.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
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
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Settings2 className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">Pipeline Stages</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Design your sales sequence</p>
                    </div>
                </div>
                {!isAdding && !editingId && (
                    <Button
                        onClick={() => setIsAdding(true)}
                        className="h-11 px-6 bg-slate-900 border-none text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Stage
                    </Button>
                )}
            </div>

            <div className="relative">
                {/* Connecting Line */}
                <div className="absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent dark:from-slate-800 dark:via-slate-800 z-0"></div>

                <div className="space-y-4 relative z-10">
                    {isAdding && (
                        <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border-2 border-blue-500/50 dark:border-blue-500/30 rounded-2xl shadow-xl shadow-blue-500/10 animate-in fade-in zoom-in-95 duration-300 ml-12 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
                            
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-6">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Stage Name</label>
                                    <Input
                                        placeholder="e.g., Discovery Call"
                                        value={statusForm.status_name}
                                        onChange={(e) => setStatusForm({ ...statusForm, status_name: e.target.value })}
                                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-11 rounded-xl font-bold text-sm"
                                        autoFocus
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Order Position</label>
                                    <Input
                                        type="number"
                                        placeholder="Order"
                                        value={statusForm.sort_order}
                                        onChange={(e) => setStatusForm({ ...statusForm, sort_order: parseInt(e.target.value) || 0 })}
                                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-11 rounded-xl font-black text-center text-sm"
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Badge Color</label>
                                    <div className="flex items-center gap-2 h-11 bg-slate-50 dark:bg-slate-950 px-3 border border-slate-200 dark:border-slate-800 rounded-xl">
                                        <Palette className="w-4 h-4 text-slate-400" />
                                        <input
                                            type="color"
                                            value={statusForm.status_color}
                                            onChange={(e) => setStatusForm({ ...statusForm, status_color: e.target.value })}
                                            className="w-full h-6 rounded cursor-pointer border-none bg-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-2 border-l border-slate-100 dark:border-slate-800 pl-4">
                                <Button size="icon" onClick={() => handleSave(null)} className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-md shadow-emerald-500/20">
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={cancelEdit} className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {(statuses || []).map((status, index) => (
                        <div key={status.id} className="flex items-center gap-4 group">
                            {/* Sequence Number Indicator */}
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 shadow-sm relative transition-all group-hover:border-blue-500 group-hover:text-blue-500 text-slate-400">
                                <span className="font-black text-xs">{String(status.sort_order || index + 1).padStart(2, '0')}</span>
                            </div>

                            <div
                                className={cn(
                                    "flex-1 flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden",
                                    editingId === status.id
                                        ? "bg-white dark:bg-slate-900 border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02] z-10"
                                        : "bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md"
                                )}
                            >
                                {editingId !== status.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: status.status_color }} />
                                )}

                                {editingId === status.id ? (
                                    <div className="w-full flex items-center gap-4 animate-in fade-in duration-200">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-1">
                                            <div className="md:col-span-6">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Stage Name</label>
                                                <Input
                                                    className="bg-slate-50 dark:bg-slate-950 border-none h-11 rounded-xl font-bold text-sm"
                                                    value={statusForm.status_name}
                                                    onChange={(e) => setStatusForm({ ...statusForm, status_name: e.target.value })}
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Order Position</label>
                                                <Input
                                                    type="number"
                                                    className="bg-slate-50 dark:bg-slate-950 border-none h-11 rounded-xl font-black text-center text-sm"
                                                    value={statusForm.sort_order}
                                                    onChange={(e) => setStatusForm({ ...statusForm, sort_order: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Badge Color</label>
                                                <div className="flex items-center gap-2 h-11 bg-slate-50 dark:bg-slate-950 px-3 rounded-xl border-none">
                                                    <Palette className="w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="color"
                                                        value={statusForm.status_color}
                                                        onChange={(e) => setStatusForm({ ...statusForm, status_color: e.target.value })}
                                                        className="w-full h-6 rounded cursor-pointer border-none bg-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col gap-2 border-l border-slate-100 dark:border-slate-800 pl-4">
                                            <Button size="icon" onClick={() => handleSave(status.id)} className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-md shadow-emerald-500/20">
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={cancelEdit} className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-4 pl-3">
                                            <GripVertical className="h-5 w-5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-black text-sm text-slate-800 dark:text-slate-100">{status.status_name}</h3>
                                                    <div 
                                                        className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest"
                                                        style={{ backgroundColor: `${status.status_color}20`, color: status.status_color }}
                                                    >
                                                        Preview
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        </div>
                    ))}

                    {statuses.length === 0 && !isAdding && (
                        <div className="ml-16 p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center">
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No stages defined</p>
                            <p className="text-xs text-slate-500 mt-2">Create your first pipeline stage to get started.</p>
                            <Button
                                onClick={() => setIsAdding(true)}
                                variant="outline"
                                className="mt-4 rounded-xl border-slate-200 dark:border-slate-800"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Create Stage
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatusManagement;
