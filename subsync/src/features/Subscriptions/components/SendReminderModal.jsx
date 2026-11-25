import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Mail,
    Send,
    Loader2,
    Eye,
    Code,
    RotateCcw,
    ExternalLink,
    Clock,
    User,
    Globe,
    AtSign,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import api from '@/lib/axiosInstance';
import { toast } from '@/utils/toast';
import { cn } from '@/lib/utils';

export default function SendReminderModal({ isOpen, onClose, subscription, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [originalData, setOriginalData] = useState(null);

    // Editable email fields
    const [recipientEmail, setRecipientEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [htmlContent, setHtmlContent] = useState('');

    // View tab: 'preview' or 'edit'
    const [viewMode, setViewMode] = useState('preview');

    const subId = subscription?.sub_id;

    // Load preview when dialog opens
    useEffect(() => {
        if (!isOpen || !subId) return;

        loadPreview();
    }, [isOpen, subId]);

    const loadPreview = async () => {
        if (!subId) return;
        setPreviewLoading(true);
        try {
            const res = await api.post(`/subscription/${subId}/reminder-preview`);
            if (res.data && res.data.success) {
                setOriginalData(res.data);
                setRecipientEmail(res.data.to || '');
                setSubject(res.data.subject || '');
                setHtmlContent(res.data.html || '');
            } else {
                toast.error(res.data?.error || 'Failed to load reminder preview');
            }
        } catch (err) {
            console.error('Error fetching reminder preview:', err);
            toast.error(err.response?.data?.error || err.message || 'Failed to generate reminder preview');
        } finally {
            setPreviewLoading(false);
        }
    };

    const isDirty = originalData && (
        recipientEmail !== (originalData.to || '') ||
        subject !== (originalData.subject || '') ||
        htmlContent !== (originalData.html || '')
    );

    const handleReset = () => {
        if (!originalData) return;
        setRecipientEmail(originalData.to || '');
        setSubject(originalData.subject || '');
        setHtmlContent(originalData.html || '');
        toast.info('Reverted email to original template');
    };

    const handleOpenInNewTab = () => {
        if (!htmlContent) return;
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(htmlContent);
            newWindow.document.close();
        }
    };

    const handleSend = async () => {
        if (!subId) return;
        if (!recipientEmail.trim()) {
            toast.error('Recipient email cannot be empty');
            return;
        }
        if (!subject.trim()) {
            toast.error('Email subject cannot be empty');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                templateKey: 'renewal_reminder',
                to: recipientEmail,
                subject: subject.trim(),
                html: htmlContent
            };

            const res = await api.post(`/subscription/${subId}/reminder`, payload);
            if (res.data?.success) {
                toast.success('Reminder sent successfully!');
                if (onSuccess) onSuccess();
                onClose();
            } else {
                toast.error(res.data?.error || 'Failed to send reminder');
            }
        } catch (err) {
            console.error('Error sending reminder:', err);
            toast.error(err.response?.data?.error || 'Failed to send reminder email');
        } finally {
            setLoading(false);
        }
    };

    if (!subscription) return null;

    const domainName = subscription.domain_name || originalData?.domain_name || 'N/A';
    const customerName = subscription.customer_name || originalData?.customer_name || 'N/A';
    const expiryFormatted = originalData?.expiry_date_formatted || (subscription.end_date ? new Date(subscription.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A');

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[96vw] max-w-[1600px] !max-w-[96vw] h-[92vh] max-h-[94vh] p-0 gap-0 flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
                    <DialogHeader className="space-y-0.5 text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                <Mail className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                        Send Subscription Reminder
                                    </DialogTitle>
                                    <Badge variant="outline" className="text-[11px] font-semibold border-blue-500/40 text-blue-600 dark:text-blue-400">
                                        {domainName}
                                    </Badge>
                                    {isDirty && (
                                        <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                            Customized
                                        </Badge>
                                    )}
                                </div>
                                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Preview and edit email recipients, subject, and body before sending.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* Body: Two columns layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden">
                    {/* Left Column: Email Configuration & Details (4 cols) */}
                    <div className="lg:col-span-4 xl:col-span-4 p-5 sm:p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
                        {/* Subscription Info Card */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                                    <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    {domainName}
                                </span>
                                <Badge variant="outline" className="text-[10px] border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold">
                                    {subId}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Customer</span>
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 truncate">
                                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                                        {customerName}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Expiry Date</span>
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 truncate">
                                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                        {expiryFormatted}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Recipient Input */}
                        <div className="space-y-1.5">
                            <Label htmlFor="recipientEmail" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <AtSign className="w-3.5 h-3.5 text-slate-400" />
                                    Recipient Email(s)
                                </span>
                                <span className="text-[10px] font-normal text-slate-400">Comma separated</span>
                            </Label>
                            <Input
                                id="recipientEmail"
                                type="text"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                placeholder="customer@example.com, accounts@example.com"
                                className="h-10 text-xs font-medium bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                            />
                            <p className="text-[10px] text-slate-400">
                                Multiple email addresses can be separated by commas.
                            </p>
                        </div>

                        {/* Subject Input */}
                        <div className="space-y-1.5">
                            <Label htmlFor="emailSubject" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                <span>Email Subject</span>
                                <span className="text-[10px] font-normal text-slate-400">Editable</span>
                            </Label>
                            <Input
                                id="emailSubject"
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Subscription Renewal Reminder..."
                                className="h-10 text-xs font-semibold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                            />
                        </div>

                        {/* Edit Mode Notice & Tips */}
                        <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 space-y-1.5">
                            <div className="flex items-center gap-1.5 font-bold">
                                <AlertCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                <span>Direct Content Editing</span>
                            </div>
                            <p className="text-[10px] text-blue-700/90 dark:text-blue-300/80 leading-relaxed">
                                Use the <strong>Edit Content</strong> tab in the right pane to modify email HTML or text. Changes reflect live in the preview.
                            </p>
                            {isDirty && (
                                <div className="pt-1 flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                        Custom edits applied
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleReset}
                                        className="h-6 px-2 text-[10px] font-semibold border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                                    >
                                        <RotateCcw className="w-3 h-3 mr-1" /> Revert
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Live Email Preview & Editor (8 cols) */}
                    <div className="lg:col-span-8 xl:col-span-8 flex flex-col p-5 sm:p-6 bg-slate-50/60 dark:bg-slate-900/50 min-h-0 h-full overflow-hidden">
                        {/* Tab Bar & Action Controls */}
                        <div className="flex items-center justify-between mb-3 shrink-0 flex-wrap gap-2">
                            <div className="flex items-center bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('preview')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                        viewMode === 'preview'
                                            ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                    )}
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Visual Preview</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('edit')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                        viewMode === 'edit'
                                            ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                    )}
                                >
                                    <Code className="w-3.5 h-3.5" />
                                    <span>Edit HTML Content</span>
                                    {isDirty && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                                    )}
                                </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                                {htmlContent && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleOpenInNewTab}
                                        className="h-7 px-2 text-[11px] text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                        title="Open full email in new tab"
                                    >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        New Tab
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={loadPreview}
                                    disabled={previewLoading}
                                    className="h-7 px-2 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                >
                                    <RotateCcw className={cn("w-3 h-3 mr-1", previewLoading && "animate-spin")} />
                                    Reload Template
                                </Button>
                            </div>
                        </div>

                        {/* Email Frame / Editor */}
                        <div className="flex-1 min-h-0 h-full flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                            {/* Envelope Header */}
                            <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs space-y-1 shrink-0">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <span className="font-semibold text-slate-400 w-16 text-[11px]">To:</span>
                                    <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate font-semibold">
                                        {recipientEmail || 'Not specified'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <span className="font-semibold text-slate-400 w-16 text-[11px]">Subject:</span>
                                    <span className="font-semibold text-[11px] text-slate-800 dark:text-slate-200 truncate">
                                        {subject || 'No subject'}
                                    </span>
                                </div>
                            </div>

                            {/* Main Display: Iframe or Editor */}
                            <div className="relative flex-1 min-h-0 h-full bg-slate-100/50 dark:bg-slate-950/50 p-2 sm:p-3 overflow-hidden flex flex-col">
                                {previewLoading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 dark:bg-slate-950/85 backdrop-blur-xs z-10 gap-2">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Generating email preview...</span>
                                    </div>
                                )}

                                {viewMode === 'preview' ? (
                                    htmlContent ? (
                                        <iframe
                                            title="Reminder Email Preview"
                                            srcDoc={htmlContent}
                                            className="w-full flex-1 h-full min-h-0 border-0 bg-white rounded-lg shadow-xs"
                                        />
                                    ) : !previewLoading ? (
                                        <div className="flex flex-col items-center justify-center h-full p-6 text-slate-400 text-xs gap-2">
                                            <AlertCircle className="w-8 h-8 text-amber-500" />
                                            <span>No preview available</span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={loadPreview}
                                                className="text-xs mt-1"
                                            >
                                                Retry Preview
                                            </Button>
                                        </div>
                                    ) : null
                                ) : (
                                    <div className="flex-1 flex flex-col min-h-0 h-full space-y-2">
                                        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                                            <span>Edit HTML body directly. Switch to "Visual Preview" to see updates.</span>
                                            <span className="font-mono text-[10px]">{htmlContent.length} chars</span>
                                        </div>
                                        <Textarea
                                            value={htmlContent}
                                            onChange={(e) => setHtmlContent(e.target.value)}
                                            className="flex-1 min-h-0 h-full font-mono text-xs p-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg leading-relaxed resize-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Edit email HTML content here..."
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800 shrink-0">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center sm:text-left">
                        {isDirty
                            ? 'Custom content has been edited and will be sent to the recipient.'
                            : 'Default renewal reminder template will be sent.'}
                    </p>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 sm:flex-initial h-9 px-4 text-xs rounded-xl text-slate-600 dark:text-slate-400"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSend}
                            disabled={loading || previewLoading || !htmlContent || !recipientEmail}
                            className="flex-1 sm:flex-initial h-9 px-4 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                    Sending Reminder...
                                </>
                            ) : (
                                <>
                                    <Send className="w-3.5 h-3.5 mr-1.5" />
                                    Send Reminder Email
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
