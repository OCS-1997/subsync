import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Save, Send, Clock, CheckCircle2, User, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import { getMyActiveAppraisal, saveAppraisal } from "../appraisalSlice";

export default function AppraisalForm() {
    const dispatch = useDispatch();
    const { activeAppraisalInfo, loading } = useSelector((state) => state.appraisals);
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
            setResponses({
                working_days: activeAppraisalInfo.autoStats.working_days.toString(),
                days_present: activeAppraisalInfo.autoStats.days_present.toString(),
                effective_hours: activeAppraisalInfo.autoStats.effective_hours.toString()
            });
        }
    }, [activeAppraisalInfo]);

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
            
            toast.success(status === 'Submitted' ? "Appraisal submitted successfully!" : "Draft saved successfully.");
            dispatch(getMyActiveAppraisal());
        } catch (err) {
            toast.error(err || "Failed to save appraisal");
        } finally {
            setSubmitting(false);
        }
    };

    const answeredCount = questions.filter(q => responses[q.id] && responses[q.id].trim() !== "").length;
    const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

    const breadcrumbItems = [
        { label: 'Self Appraisal' }
    ];

    if (loading && !activeAppraisalInfo) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!activeAppraisalInfo?.active) {
        return (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
                <PageHeader 
                    title="Self Appraisal"
                    description="Answer self-appraisal questions for your current review period."
                    breadcrumbItems={breadcrumbItems}
                />
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <h3 className="text-base font-semibold text-foreground">No active appraisal period</h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                        There is currently no active appraisal period open. You will be notified when a new period starts.
                    </p>
                </div>
            </div>
        );
    }

    const actions = !isSubmitted ? (
        <div className="flex items-center gap-2">
            <Button 
                variant="outline" 
                onClick={() => handleSave('Draft')} 
                disabled={submitting}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold h-9 sm:h-10"
            >
                <Save className="h-4 w-4 mr-1.5" />
                Save Draft
            </Button>
            <Button 
                onClick={() => handleSave('Submitted')} 
                disabled={submitting}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold h-9 sm:h-10 shadow-sm"
            >
                <Send className="h-4 w-4 mr-1.5" />
                Submit Appraisal
            </Button>
        </div>
    ) : (
        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-3 py-1 text-xs">
            Submitted
        </Badge>
    );

    const deadlineFormatted = period.end_date 
        ? new Date(period.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : '';

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
            <PageHeader 
                title="Self Appraisal"
                description={`Review Period: ${period.quarter} ${period.year} • Deadline: ${deadlineFormatted}`}
                breadcrumbItems={breadcrumbItems}
                actions={actions}
            />

            {/* Progress Card */}
            {!isSubmitted && (
                <div className="space-y-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            Your Progress
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                            {answeredCount} of {questions.length} answered
                        </span>
                    </div>
                    <Progress value={progress} className="h-2 bg-slate-100 dark:bg-slate-800" />
                </div>
            )}

            {isSubmitted && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-sm text-emerald-800 dark:text-emerald-300">Appraisal Submitted</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                            {appraisal.status === 'Reviewed' 
                                ? 'Your manager has reviewed your submission. See their feedback below.' 
                                : 'You have submitted your appraisal for this period. It is waiting for manager review.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Questions Card */}
            <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                <CardHeader className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-base sm:text-lg font-bold text-foreground">Appraisal Questions</CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                Please answer the questions below about your work and achievements.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 self-start sm:self-auto">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-semibold text-foreground">{user?.name || user?.username}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
                    {questions.map((q, index) => (
                        <div 
                            key={q.id} 
                            className={`p-4 sm:p-6 transition-colors ${
                                !isSubmitted && responses[q.id]?.trim() ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                            }`}
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                                            Question {index + 1}
                                        </span>
                                        {['working_days', 'days_present', 'effective_hours'].includes(q.id) && (
                                            <span className="text-[11px] font-medium text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                Auto-filled
                                            </span>
                                        )}
                                        {q.required && (
                                            <span className="text-[11px] font-medium text-red-500">
                                                Required
                                            </span>
                                        )}
                                    </div>
                                    {responses[q.id]?.trim() && (
                                        <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Answered
                                        </span>
                                    )}
                                </div>

                                <Label className="text-sm sm:text-base font-semibold text-foreground block leading-snug">
                                    {q.label}
                                </Label>

                                {q.type === 'textarea' ? (
                                    <Textarea
                                        value={responses[q.id] || ""}
                                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                                        placeholder="Write your answer here..."
                                        className="min-h-[120px] text-sm rounded-xl leading-relaxed"
                                        readOnly={isSubmitted}
                                    />
                                ) : (
                                    <Input
                                        type={q.type || "text"}
                                        value={responses[q.id] || ""}
                                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                                        placeholder="Enter your answer..."
                                        className="h-10 text-sm rounded-xl max-w-xs"
                                        readOnly={isSubmitted}
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Manager Feedback Section */}
            {appraisal?.status === 'Reviewed' && (
                <Card className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm overflow-hidden">
                    <CardHeader className="p-4 sm:p-5 pb-2">
                        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            Manager Feedback
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 pt-2 space-y-4">
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                            {appraisal.reviewer_comments || "Review completed."}
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-blue-200/50 dark:border-blue-900/50 text-xs text-muted-foreground">
                            <span>
                                Reviewed by: <strong className="text-foreground">{appraisal.reviewed_by}</strong>
                            </span>
                            {appraisal.reviewer_date && (
                                <span>
                                    Date: <strong className="text-foreground">{new Date(appraisal.reviewer_date).toLocaleDateString()}</strong>
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
