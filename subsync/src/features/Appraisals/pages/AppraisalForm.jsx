import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Save, Send, Clock, AlertCircle, CheckCircle2, User } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getMyActiveAppraisal, saveAppraisal } from "../appraisalSlice";

export default function AppraisalForm() {
    const dispatch = useDispatch();
    const { activeAppraisalInfo, loading, error } = useSelector((state) => state.appraisals);
    const { user } = useSelector((state) => state.auth);

    const [responses, setResponses] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const { period, appraisal } = activeAppraisalInfo || {};
    const questions = period?.questions || [];
    const isSubmitted = appraisal?.status === 'Submitted' || appraisal?.status === 'Reviewed';

    useEffect(() => {
        dispatch(getMyActiveAppraisal());
    }, [dispatch]);

    useEffect(() => {
        if (activeAppraisalInfo?.appraisal?.responses) {
            setResponses(activeAppraisalInfo.appraisal.responses);
        } else if (activeAppraisalInfo?.autoStats) {
            // Pre-fill with auto-calculated stats for new appraisals
            setResponses({
                working_days: activeAppraisalInfo.autoStats.working_days.toString(),
                days_present: activeAppraisalInfo.autoStats.days_present.toString(),
                effective_hours: activeAppraisalInfo.autoStats.effective_hours.toString()
            });
        }
    }, [activeAppraisalInfo]);

    // Handle updates to autoStats if responses are already partially filled but missing these
    useEffect(() => {
        if (activeAppraisalInfo?.autoStats && !isSubmitted) {
            setResponses(prev => {
                const next = { ...prev };
                let changed = false;
                
                ['working_days', 'days_present', 'effective_hours'].forEach(key => {
                    if (activeAppraisalInfo.autoStats[key] !== undefined && (next[key] === undefined || next[key] === "")) {
                        next[key] = activeAppraisalInfo.autoStats[key].toString();
                        changed = true;
                    }
                });
                
                return changed ? next : prev;
            });
        }
    }, [activeAppraisalInfo?.autoStats, isSubmitted]);

    const handleInputChange = (id, value) => {
        setResponses(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleSave = async (status = 'Draft') => {
        if (!activeAppraisalInfo?.period?.id) return;

        // Validation for final submission
        if (status === 'Submitted') {
            const missingRequired = questions.filter(q => q.required && (!responses[q.id] || responses[q.id].trim() === ""));
            if (missingRequired.length > 0) {
                toast.error(`Please answer all required questions: ${missingRequired[0].label}`);
                return;
            }
        }

        setSubmitting(true);
        try {
            await dispatch(saveAppraisal({
                period_id: activeAppraisalInfo.period.id,
                responses,
                status
            })).unwrap();
            
            toast.success(status === 'Submitted' ? "Appraisal submitted successfully!" : "Progress saved as draft.");
            
            // Refresh info to show updated status
            dispatch(getMyActiveAppraisal());
        } catch (err) {
            toast.error(err || "Failed to save appraisal");
        } finally {
            setSubmitting(false);
        }
    };

    const answeredCount = questions.filter(q => responses[q.id] && responses[q.id].trim() !== "").length;
    const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

    if (loading && !activeAppraisalInfo) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!activeAppraisalInfo?.active) {
        return (
            <div className="p-6">
                <Card className="border-dashed border-2">
                    <CardContent className="pt-10 pb-10 flex flex-col items-center text-center">
                        <Clock className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                        <CardTitle className="text-xl mb-2 text-muted-foreground">No Active Appraisal Period</CardTitle>
                        <CardDescription>
                            There is currently no active appraisal period for your team. 
                            You will be notified once a new period starts.
                        </CardDescription>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                                Self Appraisal
                                {isSubmitted && (
                                    <Badge className="bg-green-500 text-white border-none px-3 py-1 text-xs font-black uppercase tracking-wider">
                                        Submitted
                                    </Badge>
                                )}
                            </h1>
                        </div>
                    </div>
                    <p className="text-muted-foreground text-lg pl-12">
                        Review Cycle: <span className="font-bold text-foreground">{period.quarter} {period.year}</span> 
                        <span className="mx-2">•</span> 
                        Deadline: <span className="font-semibold text-destructive">{new Date(period.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </p>
                </div>
                
                {!isSubmitted && (
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            onClick={() => handleSave('Draft')} 
                            disabled={submitting}
                            className="h-12 px-6 font-bold hover:bg-muted/80 rounded-xl transition-all"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Save Draft
                        </Button>
                        <Button 
                            onClick={() => handleSave('Submitted')} 
                            disabled={submitting}
                            className="h-12 px-8 font-black uppercase tracking-widest text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-[0_8px_30px_rgb(37,99,235,0.3)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.5)] transition-all rounded-xl transform hover:-translate-y-1 active:scale-95 border-b-4 border-blue-800"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Final Submit
                        </Button>
                    </div>
                )}
            </div>

            {/* Progress Bar (Mobile and Tablet) */}
            {!isSubmitted && (
                <div className="space-y-3 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-sm">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-muted-foreground flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-blue-500" />
                            Completion Progress
                        </span>
                        <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg">
                            {answeredCount} / {questions.length} answered
                        </span>
                    </div>
                    <Progress value={progress} className="h-2 bg-muted transition-all duration-1000" />
                </div>
            )}

            {isSubmitted && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-green-600 dark:text-green-400">Submission Received</p>
                        <p className="text-sm text-green-600/80 dark:text-green-400/80">
                            You have already submitted your appraisal for this period. 
                            {appraisal.status === 'Reviewed' ? ' It has been reviewed by your supervisor.' : ' It is currently awaiting review.'}
                        </p>
                    </div>
                </div>
            )}

            <Card className="border-none shadow-2xl bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl overflow-hidden rounded-3xl border border-white/20 dark:border-white/5">
                <CardHeader className="bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border-b border-border/50 p-8">
                    <div className="flex items-center justify-between gap-6">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-black tracking-tight">Appraisal Questions</CardTitle>
                            <CardDescription className="text-base">Please provide a detailed reflection of your journey during this period.</CardDescription>
                        </div>
                        <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 px-5 py-3 rounded-2xl shadow-sm border border-border/50">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                                <User className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black leading-none mb-1">Employee</p>
                                <p className="font-bold text-sm leading-none">{user?.name || user?.username}</p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                        {questions.map((q, index) => (
                            <div 
                                key={q.id} 
                                className={`p-8 lg:p-12 transition-all duration-300 ${!isSubmitted && (responses[q.id]?.trim() ? 'bg-blue-500/5' : 'hover:bg-muted/30')}`}
                            >
                                <div className="max-w-4xl mx-auto space-y-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded-md">
                                                Question {index + 1}
                                            </span>
                                            {['working_days', 'days_present', 'effective_hours'].includes(q.id) && (
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-500/10 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm border border-indigo-500/10">
                                                    <Clock className="h-3 w-3" />
                                                    Auto-calculated
                                                </span>
                                            )}
                                            {q.required && (
                                                <span className="text-[10px] font-bold uppercase tracking-tighter text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">
                                                    Required
                                                </span>
                                            )}
                                        </div>
                                        {responses[q.id]?.trim() && (
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-500/10 px-2.5 py-1 rounded-md">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Answered
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-xl font-black leading-tight text-foreground/90 block">
                                            {q.label}
                                        </Label>
                                        
                                        {q.type === 'textarea' ? (
                                            <div className="relative group">
                                                <Textarea
                                                    value={responses[q.id] || ""}
                                                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                                                    placeholder={`Write your response here...`}
                                                    className="min-h-[160px] text-lg bg-white/80 dark:bg-zinc-900/80 border-2 border-border/50 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all p-6 rounded-2xl resize-none shadow-sm leading-relaxed"
                                                    readOnly={isSubmitted}
                                                />
                                                <div className="absolute right-4 bottom-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-0 group-focus-within:opacity-100 transition-opacity">
                                                    {responses[q.id]?.length || 0} characters
                                                </div>
                                            </div>
                                        ) : (
                                            <Input
                                                type={q.type || "text"}
                                                value={responses[q.id] || ""}
                                                onChange={(e) => handleInputChange(q.id, e.target.value)}
                                                className="h-14 text-lg bg-white/80 dark:bg-zinc-900/80 border-2 border-border/50 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all px-6 rounded-xl shadow-sm"
                                                readOnly={isSubmitted}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {appraisal?.status === 'Reviewed' && (
                <Card className="border-none shadow-2xl bg-blue-600 text-white overflow-hidden rounded-3xl">
                    <CardHeader className="bg-white/10 border-b border-white/10 p-8">
                        <CardTitle className="text-xl font-black flex items-center gap-3">
                            <User className="h-6 w-6" />
                            Supervisor Review
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 lg:p-12 space-y-8">
                        <div className="text-2xl font-medium leading-relaxed italic opacity-90">
                            "{appraisal.reviewer_comments || "Overall exceptional performance. Keep up the high standards and focus on scaling existing processes."}"
                        </div>
                        
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pt-8 border-t border-white/20">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-black text-xl">
                                    {appraisal.reviewed_by?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest opacity-60 font-black mb-1">Reviewed By</p>
                                    <p className="text-lg font-bold">{appraisal.reviewed_by}</p>
                                </div>
                            </div>
                            <div className="text-left sm:text-right">
                                <p className="text-[10px] uppercase tracking-widest opacity-60 font-black mb-1">Official Date</p>
                                <p className="text-lg font-bold">{new Date(appraisal.reviewer_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
