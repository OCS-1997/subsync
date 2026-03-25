import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, CheckCircle2, AlertCircle, FileText, Send, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
    const { periodId } = useParams();
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
            toast.success("Review submitted successfully!");
            setIsReviewOpen(false);
            loadSubmissions();
        } catch (err) {
            toast.error("Failed to submit review");
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
            case 'Reviewed': return <Badge className="bg-green-500">Reviewed</Badge>;
            case 'Submitted': return <Badge className="bg-blue-500">Submitted</Badge>;
            default: return <Badge variant="outline">Draft</Badge>;
        }
    };

    return (
        <div className="p-4 lg:p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Team Submissions</h1>
                    <p className="text-muted-foreground">Review and sign off on team self-appraisals.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {submissions.map((sub) => (
                    <Card key={sub.id} className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all bg-white dark:bg-black/20">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">{sub.user_full_name}</CardTitle>
                                        <CardDescription>@{sub.username}</CardDescription>
                                    </div>
                                </div>
                                {getStatusBadge(sub.status)}
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-full"
                                    onClick={() => setDeletingSubmissionId(sub.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm text-muted-foreground italic h-12 overflow-hidden text-ellipsis line-clamp-2">
                                {sub.responses ? Object.values(sub.responses)[3]?.substring(0, 100) + '...' : 'No response content'}
                            </div>
                            
                            <div className="flex justify-between items-center pt-4 border-t">
                                <span className="text-xs text-muted-foreground">
                                    {sub.submitted_at ? `Submited: ${new Date(sub.submitted_at).toLocaleDateString()}` : 'Not submitted'}
                                </span>
                                <Button 
                                    size="sm" 
                                    variant={sub.status === 'Submitted' ? 'default' : 'outline'}
                                    disabled={sub.status === 'Draft'}
                                    onClick={() => handleOpenReview(sub)}
                                >
                                    {sub.status === 'Reviewed' ? 'View Review' : 'Review Now'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            {!loading && submissions.length === 0 && (
                <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground font-bold">No submissions found for this period.</p>
                </div>
            )}

            {/* Review Dialog */}
            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Appraisal Review: {selectedAppraisal?.user_full_name}</DialogTitle>
                        <DialogDescription>Read the employee's self-appraisal and provide your feedback.</DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4">
                        <div className="space-y-6 border rounded-xl p-6 bg-muted/5">
                            {selectedAppraisal?.responses && Object.entries(selectedAppraisal.responses).map(([key, value]) => (
                                <div key={key} className="space-y-1">
                                    <p className="text-xs uppercase font-black text-muted-foreground tracking-widest">{key.replace(/_/g, ' ')}</p>
                                    <p className="text-foreground whitespace-pre-wrap">{value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Reviewer Section
                            </h3>
                            <div className="space-y-2">
                                <Label>Supervisor Comments</Label>
                                <Textarea 
                                    placeholder="Provide constructive feedback..."
                                    className="min-h-[150px]"
                                    value={reviewData.comments}
                                    onChange={(e) => setReviewData(prev => ({ ...prev, comments: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmitReview} className="bg-primary">
                            <Send className="h-4 w-4 mr-2" />
                            Submit Review & Sign Off
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingSubmissionId} onOpenChange={() => setDeletingSubmissionId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this user's appraisal submission? 
                            This action cannot be undone and the data will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSubmission} className="bg-destructive hover:bg-destructive/90">
                            Delete Submission
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
