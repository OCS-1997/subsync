import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, CheckCircle2, AlertCircle, FileText, Send, Trash2 } from "lucide-react";
import { toast } from '@/utils/toast';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import * as appraisalAPI from "../services/appraisalAPI";

export default function AdminAppraisalSubmissions() {
    const { username, periodId } = useParams();
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppraisal, setSelectedAppraisal] = useState(null);
    const [reviewData, setReviewData] = useState({ comments: "", status: "Reviewed" });
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [deletingSubmissionId, setDeletingSubmissionId] = useState(null);

    useEffect(() => {
        loadSubmissions();
    }, [periodId]);

    const loadSubmissions = async () => {
        setLoading(true);
        try {
            const data = await appraisalAPI.fetchTeamSubmissions(periodId);
            setSubmissions(data.appraisals || []);
        } catch (err) {
            toast.error("Failed to load submissions");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenReview = (appraisal) => {
        setSelectedAppraisal(appraisal);
        setReviewData({ 
            comments: appraisal.reviewer_comments || "", 
            status: "Reviewed" 
        });
        setIsReviewOpen(true);
    };

    const handleSubmitReview = async () => {
        try {
            await appraisalAPI.reviewSubmission(selectedAppraisal.id, reviewData);
            toast.success("Feedback saved successfully!");
            setIsReviewOpen(false);
            loadSubmissions();
        } catch (err) {
            toast.error("Failed to save feedback");
        }
    };

    const handleDeleteSubmission = async () => {
        if (!deletingSubmissionId) return;
        
        try {
            await appraisalAPI.deleteSubmission(deletingSubmissionId);
            toast.success("Submission deleted successfully");
            setDeletingSubmissionId(null);
            loadSubmissions();
        } catch (err) {
            toast.error("Failed to delete submission");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Reviewed': 
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium">Reviewed</Badge>;
            case 'Submitted': 
                return <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-medium">Submitted</Badge>;
            default: 
                return <Badge variant="outline" className="text-slate-600 dark:text-slate-300 font-medium">In Progress</Badge>;
        }
    };

    const breadcrumbItems = [
        { label: 'Appraisals', href: `/${username}/dashboard/admin/appraisals` },
        { label: 'Submissions' }
    ];

    const actions = (
        <Button 
            variant="outline" 
            onClick={() => navigate(-1)} 
            className="rounded-xl border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold h-9 sm:h-10"
        >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Appraisals
        </Button>
    );

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
            <PageHeader 
                title="Employee Submissions"
                description="View employee self-appraisals and share your feedback."
                breadcrumbItems={breadcrumbItems}
                actions={actions}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {submissions.map((sub) => (
                    <Card key={sub.id} className="rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all bg-white dark:bg-slate-900 overflow-hidden flex flex-col justify-between">
                        <CardHeader className="p-4 sm:p-5 pb-3">
                            <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold text-foreground">{sub.user_full_name}</CardTitle>
                                        <CardDescription className="text-xs">@{sub.username}</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {getStatusBadge(sub.status)}
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 w-8 rounded-lg"
                                        onClick={() => setDeletingSubmissionId(sub.id)}
                                        title="Delete Submission"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
                            <div className="text-xs text-muted-foreground line-clamp-2 h-9">
                                {sub.responses ? Object.values(sub.responses)[3]?.substring(0, 100) + '...' : 'No answers written yet'}
                            </div>
                            
                            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                                <span className="text-xs text-muted-foreground">
                                    {sub.submitted_at ? `Submitted: ${new Date(sub.submitted_at).toLocaleDateString()}` : 'Not submitted yet'}
                                </span>
                                <Button 
                                    size="sm" 
                                    variant={sub.status === 'Submitted' ? 'default' : 'outline'}
                                    disabled={sub.status === 'Draft'}
                                    onClick={() => handleOpenReview(sub)}
                                    className={`rounded-lg text-xs font-semibold h-8 ${sub.status === 'Submitted' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                                >
                                    {sub.status === 'Reviewed' ? 'View Feedback' : 'Give Feedback'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}

            {!loading && submissions.length === 0 && (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <h3 className="text-base font-semibold text-foreground">No submissions found</h3>
                    <p className="text-xs text-muted-foreground mt-1">There are no employee submissions for this review period yet.</p>
                </div>
            )}

            {/* Review Dialog */}
            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] rounded-2xl p-0 overflow-hidden flex flex-col">
                    <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <DialogTitle className="text-base font-bold text-foreground">
                            Appraisal: {selectedAppraisal?.user_full_name}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Read the employee's answers and share your feedback below.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="p-6 overflow-y-auto space-y-5 flex-1">
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Employee Answers
                            </h4>
                            <div className="space-y-3">
                                {selectedAppraisal?.responses && Object.entries(selectedAppraisal.responses).map(([key, value]) => (
                                    <div key={key} className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground capitalize">
                                            {key.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-sm text-foreground whitespace-pre-wrap">
                                            {value || <span className="italic text-muted-foreground">No answer</span>}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <FileText className="h-4 w-4 text-blue-600" />
                                Manager Feedback
                            </Label>
                            <Textarea 
                                placeholder="Write helpful feedback and comments for the employee..."
                                className="min-h-[120px] rounded-xl text-sm"
                                value={reviewData.comments}
                                onChange={(e) => setReviewData(prev => ({ ...prev, comments: e.target.value }))}
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsReviewOpen(false)} className="rounded-xl text-xs font-semibold">
                            Cancel
                        </Button>
                        <Button onClick={handleSubmitReview} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            Save Feedback
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Simple Delete Submission Dialog */}
            <AlertDialog open={!!deletingSubmissionId} onOpenChange={() => setDeletingSubmissionId(null)}>
                <AlertDialogContent className="rounded-2xl p-6 max-w-md">
                    <AlertDialogHeader>
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-2 mx-auto">
                            <Trash2 className="h-6 w-6" />
                        </div>
                        <AlertDialogTitle className="text-lg font-bold text-center text-foreground">
                            Delete Submission?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-xs text-muted-foreground mt-2 leading-relaxed">
                            Are you sure you want to delete this employee's appraisal? All their submitted answers will be deleted. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-5 flex gap-2">
                        <AlertDialogCancel className="rounded-xl text-xs font-semibold flex-1">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteSubmission} 
                            className="rounded-xl text-xs font-semibold flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete Submission
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
