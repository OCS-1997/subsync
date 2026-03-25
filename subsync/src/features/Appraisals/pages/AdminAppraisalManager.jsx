import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
    Plus, Calendar, Clock, Play, Power, ChevronRight, FileJson, 
    Trash2, ListChecks, LayoutGrid, Edit, MoreVertical, Copy, 
    Eye, AlertCircle, CheckCircle2, GripVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTemplates, getPeriods, deletePeriod, updateTemplate, deleteTemplate, createTemplate } from "../appraisalSlice";
import * as appraisalAPI from "../services/appraisalAPI";

const DEFAULT_QUESTIONS = [
    { id: "working_days", label: "Working Days", type: "number", required: true },
    { id: "days_present", label: "Days Present", type: "number", required: true },
    { id: "effective_hours", label: "Effective Hours Put in", type: "number", required: true },
    { id: "new_skills", label: "New Skills Acquired / Accomplishments", type: "textarea", required: true },
    { id: "team_contribution", label: "Team Contribution (Seminars, Ideas, Collaboration)", type: "textarea", required: true },
    { id: "customer_contribution", label: "Contribution to Customers (Webinars, Visits, Suggestions)", type: "textarea", required: true },
    { id: "company_contribution", label: "Contribution to Company (Business Leads, Feedback, Referrals)", type: "textarea", required: true },
    { id: "improvement_areas", label: "Areas for Improvement and Improvement Plan", type: "textarea", required: true },
    { id: "future_goals", label: "Future Goals and Support Needed", type: "textarea", required: true }
];

export default function AdminAppraisalManager() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { templates, periods, loading } = useSelector((state) => state.appraisals);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
    const [isDeleteTemplateOpen, setIsDeleteTemplateOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [deletingPeriodId, setDeletingPeriodId] = useState(null);
    const [activeTemplate, setActiveTemplate] = useState(null);

    const [newPeriod, setNewPeriod] = useState({
        template_id: "",
        quarter: "Q1",
        year: new Date().getFullYear(),
        start_date: "",
        end_date: ""
    });

    const [templateForm, setTemplateForm] = useState({
        name: "",
        description: "",
        questions: [...DEFAULT_QUESTIONS]
    });

    useEffect(() => {
        dispatch(getTemplates());
        dispatch(getPeriods());
    }, [dispatch]);

    const handleCreatePeriod = async () => {
        try {
            await appraisalAPI.createPeriod(newPeriod);
            toast.success("Appraisal period planned successfully!");
            setIsCreateOpen(false);
            dispatch(getPeriods());
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to plan period");
        }
    };

    const handleOpenTemplateDialog = (template = null) => {
        if (template) {
            setActiveTemplate(template);
            setTemplateForm({
                name: template.name,
                description: template.description || "",
                questions: [...template.questions]
            });
        } else {
            setActiveTemplate(null);
            setTemplateForm({
                name: "",
                description: "",
                questions: [...DEFAULT_QUESTIONS]
            });
        }
        setIsTemplateDialogOpen(true);
    };

    const handleSaveTemplate = async () => {
        if (!templateForm.name || templateForm.questions.length === 0) {
            toast.error("Name and at least one question are required.");
            return;
        }

        try {
            if (activeTemplate) {
                await dispatch(updateTemplate({ id: activeTemplate.id, data: templateForm })).unwrap();
                toast.success("Template updated successfully!");
            } else {
                await dispatch(createTemplate(templateForm)).unwrap();
                toast.success("Template created successfully!");
            }
            setIsTemplateDialogOpen(false);
        } catch (err) {
            toast.error(err || "Failed to save template");
        }
    };

    const handleDeleteTemplate = async () => {
        if (!activeTemplate) return;
        try {
            await dispatch(deleteTemplate(activeTemplate.id)).unwrap();
            toast.success("Template deleted successfully");
            setIsDeleteTemplateOpen(false);
        } catch (err) {
            toast.error(err || "Failed to delete template");
        }
    };

    const handleAddQuestion = () => {
        const id = `q_${Date.now()}`;
        setTemplateForm(prev => ({
            ...prev,
            questions: [...prev.questions, { id, label: "", type: "textarea", required: true }]
        }));
    };

    const handleAction = async (id, action) => {
        try {
            if (action === 'activate') await appraisalAPI.activatePeriod(id);
            else if (action === 'close') await appraisalAPI.closePeriod(id);
            
            toast.success(`Period ${action}d successfully`);
            dispatch(getPeriods());
        } catch (err) {
            toast.error(err.response?.data?.error || "Action failed");
        }
    };

    const handleDeletePeriod = async () => {
        if (!deletingPeriodId) return;
        try {
            await dispatch(deletePeriod(deletingPeriodId)).unwrap();
            toast.success("Period deleted successfully");
            setDeletingPeriodId(null);
        } catch (err) {
            toast.error(err || "Failed to delete period");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Active': return <Badge className="bg-emerald-500 text-white border-none animate-pulse">Active</Badge>;
            case 'Closed': return <Badge variant="secondary">Closed</Badge>;
            default: return <Badge variant="outline">Planned</Badge>;
        }
    };

    return (
        <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                        Appraisal Studio
                    </h1>
                    <p className="text-muted-foreground mt-1">Design your performance review cycles and manage templates.</p>
                </div>
                
                <div className="flex gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => handleOpenTemplateDialog()}
                        className="bg-white/50 backdrop-blur-md border-primary/20 hover:bg-primary/5 transition-all duration-300"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Template
                    </Button>

                    <Button 
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-primary hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all duration-300"
                    >
                        <Calendar className="h-4 w-4 mr-2" />
                        Plan Cycle
                    </Button>
                </div>
            </header>

            <Tabs defaultValue="periods" className="w-full">
                <TabsList className="bg-muted/50 p-1 rounded-2xl border border-white/20 backdrop-blur-sm self-start mb-8">
                    <TabsTrigger value="periods" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Appraisal Periods
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        Design Templates
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="periods" className="space-y-6">
                    <div className="grid gap-6">
                        <AnimatePresence mode="popLayout">
                            {periods.map((period, idx) => (
                                <motion.div
                                    key={period.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <Card className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/60 dark:bg-black/20 backdrop-blur-xl group">
                                        <div className="flex flex-col md:flex-row items-stretch">
                                            <div className={`w-1.5 md:w-2 transition-all duration-500 group-hover:w-3 ${
                                                period.status === 'Active' ? 'bg-emerald-500' : 
                                                period.status === 'Closed' ? 'bg-slate-400' : 'bg-primary/40'
                                            }`} />
                                            <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <h2 className="text-2xl font-black">{period.quarter} {period.year}</h2>
                                                        {getStatusBadge(period.status)}
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                            <div className="p-1 bg-primary/5 rounded-md">
                                                                <ListChecks className="h-3.5 w-3.5 text-primary" />
                                                            </div>
                                                            Template: <span className="font-bold text-foreground">{period.template_name}</span>
                                                        </p>
                                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                            <div className="p-1 bg-emerald-500/5 rounded-md">
                                                                <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                                                            </div>
                                                            {new Date(period.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(period.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => navigate(`period/${period.id}`)}
                                                        className="hover:bg-primary/5 rounded-full px-4"
                                                    >
                                                        View Reports
                                                        <ChevronRight className="h-4 w-4 ml-1" />
                                                    </Button>

                                                    <div className="w-px h-8 bg-border/50 hidden md:block" />

                                                    {period.status === 'Planned' && (
                                                        <Button 
                                                            size="sm" 
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 shadow-lg shadow-emerald-500/20"
                                                            onClick={() => handleAction(period.id, 'activate')}
                                                        >
                                                            <Play className="h-4 w-4 mr-2" />
                                                            Activate
                                                        </Button>
                                                    )}

                                                    {period.status === 'Active' && (
                                                        <Button 
                                                            size="sm" 
                                                            variant="destructive"
                                                            className="rounded-full px-6 shadow-lg shadow-destructive/20"
                                                            onClick={() => handleAction(period.id, 'close')}
                                                        >
                                                            <Power className="h-4 w-4 mr-2" />
                                                            End Cycle
                                                        </Button>
                                                    )}

                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 rounded-full transition-colors"
                                                        onClick={() => setDeletingPeriodId(period.id)}
                                                    >
                                                        <Trash2 className="h-4 w-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        {periods.length === 0 && (
                            <div className="text-center py-24 bg-muted/20 rounded-[2rem] border-2 border-dashed border-muted transition-all hover:bg-muted/30">
                                <div className="relative inline-block">
                                    <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-10" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <AlertCircle className="h-6 w-6 text-muted-foreground/30" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-muted-foreground/50">No Active Cycles</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto mt-2">Plan a new appraisal period to start collecting performance feedback.</p>
                                <Button variant="outline" className="mt-6 rounded-full" onClick={() => setIsCreateOpen(true)}>
                                    Get Started
                                </Button>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="templates" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {templates.map((template, idx) => (
                                <motion.div
                                    key={template.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ y: -5 }}
                                >
                                    <Card className="border-none shadow-xl bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl relative group overflow-hidden h-full flex flex-col">
                                        {/* Gradient Accent */}
                                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/80 via-primary to-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        
                                        <CardHeader className="pb-4">
                                            <div className="flex justify-between items-start">
                                                <div className="p-3 bg-primary/10 text-primary rounded-2xl group-hover:scale-110 transition-transform duration-500">
                                                    <FileJson className="h-6 w-6" />
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                                                        <DropdownMenuItem onClick={() => handleOpenTemplateDialog(template)} className="rounded-lg gap-2">
                                                            <Edit className="h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => {
                                                            setActiveTemplate(template);
                                                            setIsPreviewOpen(true);
                                                        }} className="rounded-lg gap-2">
                                                            <Eye className="h-4 w-4" /> Preview
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="rounded-lg gap-2">
                                                            <Copy className="h-4 w-4" /> Duplicate
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            onClick={() => {
                                                                setActiveTemplate(template);
                                                                setIsDeleteTemplateOpen(true);
                                                            }} 
                                                            className="rounded-lg gap-2 text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <CardTitle className="text-xl font-black mt-4 group-hover:text-primary transition-colors">{template.name}</CardTitle>
                                            <CardDescription className="line-clamp-2 h-10 mt-1">{template.description || "Versatile appraisal form for comprehensive performance reviews."}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6 flex-1">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-muted/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-colors group-hover:bg-primary/5">
                                                    <span className="text-2xl font-black text-primary">{template.questions?.length || 0}</span>
                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-1">Questions</span>
                                                </div>
                                                <div className="bg-muted/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-colors group-hover:bg-emerald-500/5">
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-1" />
                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Certified</span>
                                                </div>
                                            </div>
                                            
                                            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
                                                <span>Modified</span>
                                                <span>{new Date(template.updated_at || template.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </CardContent>
                                        
                                        <div className="p-4 pt-0">
                                            <Button 
                                                variant="outline" 
                                                className="w-full rounded-xl border-dashed hover:border-solid hover:bg-primary hover:text-white transition-all duration-300 gap-2"
                                                onClick={() => {
                                                    setNewPeriod(p => ({ ...p, template_id: template.id.toString() }));
                                                    setIsCreateOpen(true);
                                                }}
                                            >
                                                <Play className="h-3.5 w-3.5" /> Use to Plan Cycle
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {templates.length === 0 && (
                            <div className="col-span-full text-center py-24 bg-muted/10 rounded-[2rem] border-2 border-dashed border-muted/50">
                                <LayoutGrid className="h-20 w-20 text-muted-foreground mx-auto mb-4 opacity-5" />
                                <h3 className="text-xl font-bold text-muted-foreground/40">No Blueprints Found</h3>
                                <p className="text-muted-foreground mt-2">Create your first appraisal blueprint to start standardizing reviews.</p>
                                <Button className="mt-8 rounded-full px-10" onClick={() => handleOpenTemplateDialog()}>
                                    Build Blueprint
                                </Button>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Template Creation/Edit Dialog */}
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[95vh] rounded-[2rem] overflow-hidden p-0 gap-0 border-none shadow-2xl">
                    <div className="bg-primary/5 p-8 border-b border-primary/10">
                        <DialogHeader>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/30">
                                    <FileJson className="h-6 w-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-black">{activeTemplate ? 'Edit Blueprint' : 'Design Blueprint'}</DialogTitle>
                                    <DialogDescription>Construct the perfect set of questions for your team feedback.</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 200px)' }}>
                        <div className="grid gap-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Blueprint Identity</Label>
                                    <Input 
                                        placeholder="e.g. Executive Performance Framework" 
                                        className="rounded-xl border-2 focus:border-primary transition-all hover:bg-muted/10 h-12"
                                        value={templateForm.name}
                                        onChange={(e) => setTemplateForm(p => ({ ...p, name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Scope / Context</Label>
                                    <Input 
                                        placeholder="Brief context for managers using this" 
                                        className="rounded-xl border-2 focus:border-primary transition-all hover:bg-muted/10 h-12"
                                        value={templateForm.description}
                                        onChange={(e) => setTemplateForm(p => ({ ...p, description: e.target.value }))}
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="flex justify-between items-center border-b pb-4 border-border/50">
                                    <h3 className="text-lg font-black tracking-tight">Question Architecture</h3>
                                    <Button size="sm" variant="outline" className="rounded-full px-6 bg-primary/5 border-primary/20 text-primary hover:bg-primary transition-all hover:text-white" onClick={handleAddQuestion}>
                                        <Plus className="h-4 w-4 mr-1.5" /> Append Question
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <AnimatePresence>
                                        {templateForm.questions.map((q, idx) => (
                                            <motion.div 
                                                key={q.id}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="group relative"
                                            >
                                                <div className="p-5 border-2 border-border/40 rounded-[1.5rem] bg-muted/5 transition-all focus-within:border-primary/40 focus-within:shadow-lg focus-within:bg-white dark:focus-within:bg-zinc-900 group-hover:border-border group-hover:shadow-md">
                                                    <div className="flex gap-4 items-start">
                                                        <div className="mt-8 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-primary transition-colors">
                                                            <GripVertical className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex-1 space-y-4">
                                                            <div className="grid grid-cols-12 gap-4">
                                                                <div className="col-span-12 md:col-span-8 space-y-1.5">
                                                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground/60">Question Text</Label>
                                                                    <Input 
                                                                        className="rounded-lg border-muted h-10 transition-all font-medium"
                                                                        value={q.label}
                                                                        onChange={(e) => {
                                                                            const qs = [...templateForm.questions];
                                                                            qs[idx].label = e.target.value;
                                                                            setTemplateForm(p => ({ ...p, questions: qs }));
                                                                        }}
                                                                        placeholder="e.g. Critical milestones achieved this quarter?"
                                                                    />
                                                                </div>
                                                                <div className="col-span-6 md:col-span-3 space-y-1.5">
                                                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground/60">Response Mode</Label>
                                                                    <Select 
                                                                        value={q.type}
                                                                        onValueChange={(val) => {
                                                                            const qs = [...templateForm.questions];
                                                                            qs[idx].type = val;
                                                                            setTemplateForm(p => ({ ...p, questions: qs }));
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="rounded-lg h-10">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="rounded-xl overflow-hidden shadow-2xl">
                                                                            <SelectItem value="text">Single Line Text</SelectItem>
                                                                            <SelectItem value="textarea">Multi-line Essay</SelectItem>
                                                                            <SelectItem value="number">Numeric Metrics</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="col-span-6 md:col-span-1 flex items-center justify-end mt-6">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-full h-10 w-10 transition-all"
                                                                        onClick={() => {
                                                                            const qs = templateForm.questions.filter((_, i) => i !== idx);
                                                                            setTemplateForm(p => ({ ...p, questions: qs }));
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t border-border bg-muted/10">
                        <DialogFooter className="gap-3">
                            <Button variant="ghost" onClick={() => setIsTemplateDialogOpen(false)} className="rounded-full px-8">Discard</Button>
                            <Button onClick={handleSaveTemplate} className="rounded-full px-10 shadow-xl shadow-primary/20">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {activeTemplate ? 'Update Blueprint' : 'Finalize & Save'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Cycle Planning Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl max-w-md">
                    <div className="bg-gradient-to-br from-primary via-primary to-primary-foreground/20 p-8 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Plan Appraisal Cycle</DialogTitle>
                                <DialogDescription className="text-primary-foreground/80 mt-1">Initiate a formal review period for the entire organization.</DialogDescription>
                            </DialogHeader>
                        </div>
                        <Calendar className="absolute -bottom-8 -right-8 h-40 w-40 text-white/10 rotate-12" />
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest px-1">Blueprint Selection</Label>
                                <Select 
                                    value={newPeriod.template_id}
                                    onValueChange={(val) => setNewPeriod(p => ({ ...p, template_id: val }))}
                                >
                                    <SelectTrigger className="rounded-2xl h-12 border-2 focus:ring-primary">
                                        <SelectValue placeholder="Choose a blueprint..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {templates.map(t => (
                                            <SelectItem key={t.id} value={t.id.toString()} className="rounded-lg">{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Quarter</Label>
                                    <Select 
                                        defaultValue="Q1" 
                                        onValueChange={(val) => setNewPeriod(p => ({ ...p, quarter: val }))}
                                    >
                                        <SelectTrigger className="rounded-xl h-11 border-2"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="Q1">Q1 (Jan-Mar)</SelectItem>
                                            <SelectItem value="Q2">Q2 (Apr-Jun)</SelectItem>
                                            <SelectItem value="Q3">Q3 (Jul-Sep)</SelectItem>
                                            <SelectItem value="Q4">Q4 (Oct-Dec)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Year</Label>
                                    <Input 
                                        type="number" 
                                        className="rounded-xl h-11 border-2"
                                        value={newPeriod.year} 
                                        onChange={(e) => setNewPeriod(p => ({ ...p, year: e.target.value }))} 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Start Trigger</Label>
                                    <Input 
                                        type="date" 
                                        className="rounded-xl h-11 border-2"
                                        onChange={(e) => setNewPeriod(p => ({ ...p, start_date: e.target.value }))} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Official Deadline</Label>
                                    <Input 
                                        type="date" 
                                        className="rounded-xl h-11 border-2"
                                        onChange={(e) => setNewPeriod(p => ({ ...p, end_date: e.target.value }))} 
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="ghost" className="rounded-full px-8" onClick={() => setIsCreateOpen(false)}>Nevermind</Button>
                            <Button onClick={handleCreatePeriod} className="rounded-full px-10 shadow-xl shadow-primary/30">
                                Launch Cycle
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-emerald-500 p-6 text-white flex items-center gap-3">
                        <Eye className="h-6 w-6" />
                        <h2 className="text-xl font-bold">Blueprint Preview: {activeTemplate?.name}</h2>
                    </div>
                    <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto bg-muted/10">
                        {activeTemplate?.questions?.map((q, i) => (
                            <div key={q.id} className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-black">{i + 1}</div>
                                    <Label className="text-sm font-semibold text-foreground/80">{q.label} {q.required && <span className="text-destructive">*</span>}</Label>
                                </div>
                                {q.type === 'textarea' ? (
                                    <div className="w-full h-32 rounded-2xl bg-white border border-border shadow-inner" />
                                ) : (
                                    <div className="w-full h-11 rounded-xl bg-white border border-border shadow-inner" />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-white border-t flex justify-end">
                        <Button className="rounded-full px-8" onClick={() => setIsPreviewOpen(false)}>Done</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Period Deletion Dialog */}
            <AlertDialog open={!!deletingPeriodId} onOpenChange={() => setDeletingPeriodId(null)}>
                <AlertDialogContent className="rounded-[2.5rem] p-8">
                    <AlertDialogHeader>
                        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4 mx-auto">
                            <AlertCircle className="h-8 w-8" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-center">Terminate Cycle?</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-lg mt-2">
                            This will permanently delete the appraisal period and all associated user submissions. 
                            <span className="block font-black text-destructive mt-2">This action is irreversible.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-4 mt-8">
                        <AlertDialogCancel className="flex-1 rounded-full h-12">Keep it</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePeriod} className="flex-1 rounded-full h-12 bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20">
                            Delete Permanently
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* Template Deletion Dialog */}
            <AlertDialog open={isDeleteTemplateOpen} onOpenChange={setIsDeleteTemplateOpen}>
                <AlertDialogContent className="rounded-[2.5rem] p-8">
                    <AlertDialogHeader>
                        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4 mx-auto">
                            <Trash2 className="h-8 w-8" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-center">Delete Blueprint?</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-lg mt-2">
                            Are you sure you want to remove <span className="font-bold text-foreground">"{activeTemplate?.name}"</span>? 
                            This cannot be undone and may fail if the blueprint is active in a cycle.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-4 mt-8">
                        <AlertDialogCancel className="flex-1 rounded-full h-12">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTemplate} className="flex-1 rounded-full h-12 bg-destructive hover:bg-destructive/90">
                            Confirm Deletion
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
