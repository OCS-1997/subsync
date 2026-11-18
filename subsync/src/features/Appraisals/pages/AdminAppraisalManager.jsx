import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { 
    Plus, Calendar, Clock, Play, Power, ChevronRight, FileText, 
    Trash2, ListChecks, Edit, MoreVertical, Copy, 
    Eye, AlertCircle, CheckCircle2, GripVertical, CheckSquare, Square
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from '@/utils/toast';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTemplates, getPeriods, deletePeriod, updateTemplate, deleteTemplate, createTemplate } from "../appraisalSlice";
import * as appraisalAPI from "../services/appraisalAPI";

const DEFAULT_QUESTIONS = [
    { id: "working_days", label: "Working Days", type: "number", required: true },
    { id: "days_present", label: "Days Present", type: "number", required: true },
    { id: "effective_hours", label: "Hours Worked", type: "number", required: true },
    { id: "new_skills", label: "New skills learned and achievements", type: "textarea", required: true },
    { id: "team_contribution", label: "How you helped your team (ideas, collaboration, teamwork)", type: "textarea", required: true },
    { id: "customer_contribution", label: "How you helped customers or clients", type: "textarea", required: true },
    { id: "company_contribution", label: "How you helped the company grow", type: "textarea", required: true },
    { id: "improvement_areas", label: "Areas you want to improve and your plan", type: "textarea", required: true },
    { id: "future_goals", label: "Your goals for next quarter and help needed", type: "textarea", required: true }
];

export default function AdminAppraisalManager() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { username } = useParams();
    const { templates = [], periods = [], loading } = useSelector((state) => state.appraisals);

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
        if (!newPeriod.template_id || !newPeriod.start_date || !newPeriod.end_date) {
            toast.error("Please fill in all fields.");
            return;
        }

        if (new Date(newPeriod.start_date) > new Date(newPeriod.end_date)) {
            toast.error("Start date cannot be after end date.");
            return;
        }

        try {
            await appraisalAPI.createPeriod(newPeriod);
            toast.success("Review period created successfully!");
            setIsCreateOpen(false);
            dispatch(getPeriods());
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to create review period");
        }
    };

    const handleOpenTemplateDialog = (template = null) => {
        if (template) {
            setActiveTemplate(template);
            setTemplateForm({
                name: template.name,
                description: template.description || "",
                questions: Array.isArray(template.questions) ? [...template.questions] : [...DEFAULT_QUESTIONS]
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

    const handleDuplicateTemplate = (template) => {
        setActiveTemplate(null);
        setTemplateForm({
            name: `${template.name} (Copy)`,
            description: template.description || "",
            questions: (template.questions || []).map((q, index) => ({
                ...q,
                id: `q_${Date.now()}_${index}`
            }))
        });
        setIsTemplateDialogOpen(true);
    };

    const handleSaveTemplate = async () => {
        if (!templateForm.name.trim()) {
            toast.error("Please enter a template name.");
            return;
        }
        if (!templateForm.questions || templateForm.questions.length === 0) {
            toast.error("Please add at least one question.");
            return;
        }

        const emptyQuestion = templateForm.questions.find(q => !q.label.trim());
        if (emptyQuestion) {
            toast.error("Please fill in question text for all questions.");
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
            setActiveTemplate(null);
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
            if (action === 'activate') {
                await appraisalAPI.activatePeriod(id);
                toast.success("Review period started successfully");
            } else if (action === 'close') {
                await appraisalAPI.closePeriod(id);
                toast.success("Review period closed successfully");
            }
            dispatch(getPeriods());
        } catch (err) {
            toast.error(err.response?.data?.error || "Action failed");
        }
    };

    const handleDeletePeriod = async () => {
        if (!deletingPeriodId) return;
        try {
            await dispatch(deletePeriod(deletingPeriodId)).unwrap();
            toast.success("Review period deleted successfully");
            setDeletingPeriodId(null);
        } catch (err) {
            toast.error(err || "Failed to delete review period");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Active':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium">Active</Badge>;
            case 'Closed':
                return <Badge variant="secondary" className="font-medium text-slate-600 dark:text-slate-300">Closed</Badge>;
            default:
                return <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50 dark:bg-blue-950/40 font-medium">Upcoming</Badge>;
        }
    };

    const activePeriodsCount = periods.filter(p => p.status === 'Active').length;
    const closedPeriodsCount = periods.filter(p => p.status === 'Closed').length;

    const breadcrumbItems = [
        { label: 'Appraisals' }
    ];

    const actions = (
        <div className="flex flex-wrap items-center gap-2">
            <Button 
                variant="outline" 
                onClick={() => handleOpenTemplateDialog()}
                className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold h-9 sm:h-10"
            >
                <Plus className="h-4 w-4 mr-1.5 text-blue-600" />
                New Template
            </Button>

            <Button 
                onClick={() => setIsCreateOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm text-xs sm:text-sm font-semibold h-9 sm:h-10"
            >
                <Calendar className="h-4 w-4 mr-1.5" />
                New Review Period
            </Button>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
            {/* Standard Page Header */}
            <PageHeader 
                title="Performance Appraisals"
                description="Manage review periods and question forms for your team."
                breadcrumbItems={breadcrumbItems}
                actions={actions}
            />

            {/* Quick Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Periods</p>
                            <h3 className="text-xl font-bold text-foreground">{periods.length}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <Play className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Periods</p>
                            <h3 className="text-xl font-bold text-foreground">{activePeriodsCount}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Form Templates</p>
                            <h3 className="text-xl font-bold text-foreground">{templates.length}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Closed Periods</p>
                            <h3 className="text-xl font-bold text-foreground">{closedPeriodsCount}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="periods" className="w-full">
                <TabsList className="border-b border-slate-200 dark:border-slate-800 bg-transparent p-0 h-auto justify-start gap-4 sm:gap-6 rounded-none mb-6 w-full flex-wrap">
                    <TabsTrigger 
                        value="periods" 
                        className="border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none px-2 sm:px-3 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400"
                    >
                        <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                        Review Periods ({periods.length})
                    </TabsTrigger>
                    <TabsTrigger 
                        value="templates" 
                        className="border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none px-2 sm:px-3 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400"
                    >
                        <FileText className="w-4 h-4 mr-2 text-purple-600" />
                        Question Forms ({templates.length})
                    </TabsTrigger>
                </TabsList>

                {/* Review Periods Tab Content */}
                <TabsContent value="periods" className="space-y-4">
                    <div className="grid gap-4">
                        <AnimatePresence mode="popLayout">
                            {periods.map((period, idx) => (
                                <motion.div
                                    key={period.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                >
                                    <Card className="rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all duration-200 bg-white dark:bg-slate-900 overflow-hidden">
                                        <div className="flex flex-col md:flex-row items-stretch">
                                            <div className={`w-1.5 md:w-2 shrink-0 ${
                                                period.status === 'Active' ? 'bg-emerald-500' : 
                                                period.status === 'Closed' ? 'bg-slate-400' : 'bg-blue-500'
                                            }`} />
                                            <div className="flex-1 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <h2 className="text-xl font-bold text-foreground">
                                                            {period.quarter} {period.year}
                                                        </h2>
                                                        {getStatusBadge(period.status)}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1.5">
                                                            <ListChecks className="h-3.5 w-3.5 text-blue-600" />
                                                            Form: <strong className="text-foreground font-semibold">{period.template_name || 'Standard Form'}</strong>
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                                            {new Date(period.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – {new Date(period.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => navigate(`period/${period.id}`)}
                                                        className="rounded-lg text-xs font-semibold h-9"
                                                    >
                                                        View Submissions
                                                        <ChevronRight className="h-4 w-4 ml-1" />
                                                    </Button>

                                                    {period.status === 'Planned' && (
                                                        <Button 
                                                            size="sm" 
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold h-9"
                                                            onClick={() => handleAction(period.id, 'activate')}
                                                        >
                                                            <Play className="h-3.5 w-3.5 mr-1.5" />
                                                            Start Period
                                                        </Button>
                                                    )}

                                                    {period.status === 'Active' && (
                                                        <Button 
                                                            size="sm" 
                                                            variant="destructive"
                                                            className="rounded-lg text-xs font-semibold h-9"
                                                            onClick={() => handleAction(period.id, 'close')}
                                                        >
                                                            <Power className="h-3.5 w-3.5 mr-1.5" />
                                                            Close Submissions
                                                        </Button>
                                                    )}

                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-9 w-9 rounded-lg"
                                                        onClick={() => setDeletingPeriodId(period.id)}
                                                        title="Delete Review Period"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        {periods.length === 0 && !loading && (
                            <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 mx-auto flex items-center justify-center mb-3">
                                    <Calendar className="h-6 w-6" />
                                </div>
                                <h3 className="text-base font-semibold text-foreground">No review periods yet</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                                    Create a review period so team members can fill out and submit their appraisals.
                                </p>
                                <Button className="mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold" onClick={() => setIsCreateOpen(true)}>
                                    <Plus className="h-4 w-4 mr-1.5" />
                                    Create Review Period
                                </Button>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Question Forms Tab Content */}
                <TabsContent value="templates" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence mode="popLayout">
                            {templates.map((template, idx) => (
                                <motion.div
                                    key={template.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                >
                                    <Card className="rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all duration-200 bg-white dark:bg-slate-900 h-full flex flex-col justify-between">
                                        <CardHeader className="p-4 sm:p-5 pb-3">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="w-10 h-10 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center shrink-0">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44 rounded-xl p-1.5">
                                                        <DropdownMenuItem onClick={() => handleOpenTemplateDialog(template)} className="rounded-lg gap-2 text-xs font-medium cursor-pointer">
                                                            <Edit className="h-3.5 w-3.5" /> Edit Form
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => {
                                                            setActiveTemplate(template);
                                                            setIsPreviewOpen(true);
                                                        }} className="rounded-lg gap-2 text-xs font-medium cursor-pointer">
                                                            <Eye className="h-3.5 w-3.5" /> Preview
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)} className="rounded-lg gap-2 text-xs font-medium cursor-pointer">
                                                            <Copy className="h-3.5 w-3.5" /> Duplicate
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            onClick={() => {
                                                                setActiveTemplate(template);
                                                                setIsDeleteTemplateOpen(true);
                                                            }} 
                                                            className="rounded-lg gap-2 text-xs font-medium text-red-600 focus:text-red-600 cursor-pointer"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" /> Delete Form
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <CardTitle className="text-base font-bold mt-3 text-foreground line-clamp-1">{template.name}</CardTitle>
                                            <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                {template.description || "Question form for staff appraisals."}
                                            </CardDescription>
                                        </CardHeader>

                                        <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-slate-100 dark:border-slate-800">
                                                <span className="font-medium text-foreground">
                                                    {template.questions?.length || 0} questions
                                                </span>
                                                <span>
                                                    {template.updated_at ? `Updated ${new Date(template.updated_at).toLocaleDateString()}` : 'Ready to use'}
                                                </span>
                                            </div>
                                            
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                className="w-full rounded-lg text-xs font-semibold border-slate-200 dark:border-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30 gap-1.5"
                                                onClick={() => {
                                                    setNewPeriod(p => ({ ...p, template_id: template.id.toString() }));
                                                    setIsCreateOpen(true);
                                                }}
                                            >
                                                <Calendar className="h-3.5 w-3.5" />
                                                Use in New Period
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {templates.length === 0 && !loading && (
                            <div className="col-span-full text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 mx-auto flex items-center justify-center mb-3">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <h3 className="text-base font-semibold text-foreground">No form templates yet</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                                    Create a question form to use when starting a review period.
                                </p>
                                <Button className="mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold" onClick={() => handleOpenTemplateDialog()}>
                                    <Plus className="h-4 w-4 mr-1.5" />
                                    Create Template
                                </Button>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Template Creation / Edit Dialog */}
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] rounded-2xl p-0 overflow-hidden flex flex-col">
                    <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <DialogTitle className="text-lg font-bold text-foreground">
                            {activeTemplate ? 'Edit Question Form' : 'Create Question Form'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Set a name and add the questions you want employees to answer.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 overflow-y-auto space-y-5 flex-1">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">Form Name</Label>
                                <Input 
                                    placeholder="e.g. Quarterly Performance Review" 
                                    className="rounded-xl h-10"
                                    value={templateForm.name}
                                    onChange={(e) => setTemplateForm(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">Description (Optional)</Label>
                                <Input 
                                    placeholder="e.g. Standard review questions for team members" 
                                    className="rounded-xl h-10"
                                    value={templateForm.description}
                                    onChange={(e) => setTemplateForm(p => ({ ...p, description: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Questions Editor */}
                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Questions ({templateForm.questions.length})
                                </Label>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="rounded-lg text-xs font-semibold h-8"
                                    onClick={handleAddQuestion}
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Question
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {templateForm.questions.map((q, idx) => (
                                    <div 
                                        key={q.id || idx}
                                        className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 space-y-3"
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className="text-xs font-bold text-muted-foreground mt-2 w-5 text-center">
                                                {idx + 1}.
                                            </span>
                                            <div className="flex-1 space-y-2">
                                                <Input 
                                                    className="rounded-lg h-9 text-sm"
                                                    value={q.label}
                                                    onChange={(e) => {
                                                        const qs = [...templateForm.questions];
                                                        qs[idx].label = e.target.value;
                                                        setTemplateForm(p => ({ ...p, questions: qs }));
                                                    }}
                                                    placeholder="Enter question text here..."
                                                />

                                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-xs text-muted-foreground font-medium">Answer type:</Label>
                                                        <Select 
                                                            value={q.type}
                                                            onValueChange={(val) => {
                                                                const qs = [...templateForm.questions];
                                                                qs[idx].type = val;
                                                                setTemplateForm(p => ({ ...p, questions: qs }));
                                                            }}
                                                        >
                                                            <SelectTrigger className="rounded-lg h-8 text-xs w-36">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl">
                                                                <SelectItem value="textarea">Long text</SelectItem>
                                                                <SelectItem value="text">Short text</SelectItem>
                                                                <SelectItem value="number">Number</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className={`rounded-lg h-8 px-2.5 text-xs font-medium border ${
                                                                q.required 
                                                                    ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/40 dark:border-blue-900' 
                                                                    : 'border-slate-200 dark:border-slate-800 text-muted-foreground'
                                                            }`}
                                                            onClick={() => {
                                                                const qs = [...templateForm.questions];
                                                                qs[idx].required = !qs[idx].required;
                                                                setTemplateForm(p => ({ ...p, questions: qs }));
                                                            }}
                                                        >
                                                            {q.required ? <CheckSquare className="h-3.5 w-3.5 mr-1" /> : <Square className="h-3.5 w-3.5 mr-1" />}
                                                            Required
                                                        </Button>

                                                        <Button 
                                                            type="button"
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg h-8 w-8"
                                                            onClick={() => {
                                                                const qs = templateForm.questions.filter((_, i) => i !== idx);
                                                                setTemplateForm(p => ({ ...p, questions: qs }));
                                                            }}
                                                            title="Delete Question"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsTemplateDialogOpen(false)} className="rounded-xl text-xs font-semibold">
                            Cancel
                        </Button>
                        <Button onClick={handleSaveTemplate} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                            {activeTemplate ? 'Save Changes' : 'Create Form'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Review Period Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="rounded-2xl max-w-md p-6">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-lg font-bold text-foreground">New Review Period</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Choose a question form and set dates for this review period.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-foreground">Question Form</Label>
                            <Select 
                                value={newPeriod.template_id}
                                onValueChange={(val) => setNewPeriod(p => ({ ...p, template_id: val }))}
                            >
                                <SelectTrigger className="rounded-xl h-10">
                                    <SelectValue placeholder="Select a question form..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={t.id.toString()} className="text-xs font-medium">
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">Quarter</Label>
                                <Select 
                                    defaultValue="Q1" 
                                    value={newPeriod.quarter}
                                    onValueChange={(val) => setNewPeriod(p => ({ ...p, quarter: val }))}
                                >
                                    <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="Q1">Q1 (Jan – Mar)</SelectItem>
                                        <SelectItem value="Q2">Q2 (Apr – Jun)</SelectItem>
                                        <SelectItem value="Q3">Q3 (Jul – Sep)</SelectItem>
                                        <SelectItem value="Q4">Q4 (Oct – Dec)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">Year</Label>
                                <Input 
                                    type="number" 
                                    className="rounded-xl h-10"
                                    value={newPeriod.year} 
                                    onChange={(e) => setNewPeriod(p => ({ ...p, year: e.target.value }))} 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">Start Date</Label>
                                <Input 
                                    type="date" 
                                    className="rounded-xl h-10"
                                    value={newPeriod.start_date}
                                    onChange={(e) => setNewPeriod(p => ({ ...p, start_date: e.target.value }))} 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-foreground">End Date</Label>
                                <Input 
                                    type="date" 
                                    className="rounded-xl h-10"
                                    value={newPeriod.end_date}
                                    onChange={(e) => setNewPeriod(p => ({ ...p, end_date: e.target.value }))} 
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 flex justify-end gap-2">
                        <Button variant="ghost" className="rounded-xl text-xs font-semibold" onClick={() => setIsCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreatePeriod} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">
                            Create Period
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Template Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-xl max-h-[85vh] rounded-2xl p-0 overflow-hidden flex flex-col">
                    <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <DialogTitle className="text-base font-bold text-foreground">
                            Preview: {activeTemplate?.name}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            This is how the questions will appear to employees.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 overflow-y-auto space-y-4 flex-1">
                        {activeTemplate?.questions?.map((q, i) => (
                            <div key={q.id || i} className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <span className="text-blue-600 font-bold">{i + 1}.</span>
                                    {q.label}
                                    {q.required && <span className="text-red-500">*</span>}
                                </Label>
                                {q.type === 'textarea' ? (
                                    <div className="w-full h-20 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-xs text-muted-foreground italic">
                                        Employee answer (long text)...
                                    </div>
                                ) : (
                                    <div className="w-full h-9 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 flex items-center text-xs text-muted-foreground italic">
                                        Employee answer ({q.type === 'number' ? 'number' : 'short text'})...
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800">
                        <Button className="rounded-xl text-xs font-semibold" onClick={() => setIsPreviewOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Simple Delete Review Period Dialog */}
            <AlertDialog open={!!deletingPeriodId} onOpenChange={() => setDeletingPeriodId(null)}>
                <AlertDialogContent className="rounded-2xl p-6 max-w-md">
                    <AlertDialogHeader>
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-2 mx-auto">
                            <Trash2 className="h-6 w-6" />
                        </div>
                        <AlertDialogTitle className="text-lg font-bold text-center text-foreground">
                            Delete Review Period?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-xs text-muted-foreground mt-2 leading-relaxed">
                            Are you sure you want to delete this appraisal period? All employee answers submitted for this period will also be deleted. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-5 flex gap-2">
                        <AlertDialogCancel className="rounded-xl text-xs font-semibold flex-1">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeletePeriod} 
                            className="rounded-xl text-xs font-semibold flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete Period
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Simple Delete Form Template Dialog */}
            <AlertDialog open={isDeleteTemplateOpen} onOpenChange={setIsDeleteTemplateOpen}>
                <AlertDialogContent className="rounded-2xl p-6 max-w-md">
                    <AlertDialogHeader>
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-2 mx-auto">
                            <Trash2 className="h-6 w-6" />
                        </div>
                        <AlertDialogTitle className="text-lg font-bold text-center text-foreground">
                            Delete Question Form?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-xs text-muted-foreground mt-2 leading-relaxed">
                            Are you sure you want to delete <strong className="text-foreground">"{activeTemplate?.name}"</strong>? Any questions saved in this form will be removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-5 flex gap-2">
                        <AlertDialogCancel className="rounded-xl text-xs font-semibold flex-1">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteTemplate} 
                            className="rounded-xl text-xs font-semibold flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete Form
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
