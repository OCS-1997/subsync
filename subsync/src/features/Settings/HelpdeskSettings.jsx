import { useState, useEffect } from "react";
import { toast, Bounce } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.jsx";
import {
    Activity,
    Settings,
    CheckCircle,
    XCircle,
    RefreshCw,
    Shield,
    Globe,
    Key,
    Lock,
    Send,
    Database,
    ChevronLeft,
    ChevronRight,
    Search,
    Info,
    Calendar,
    ArrowRightCircle,
    Eye
} from "lucide-react";
import api from "../../lib/axiosInstance";
import Hamster from "@/components/animations/Hamster.jsx";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import { cn } from "@/lib/utils";

function HelpdeskSettings() {
    const [settings, setSettings] = useState({
        helpdesk_url: "",
        api_key: "",
        webhook_secret: "",
        retry_count: 5
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    
    // Webhook log history state
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // CRM logs state
    const [crmLogs, setCrmLogs] = useState([]);
    const [crmLoading, setCrmLoading] = useState(false);
    const [crmPage, setCrmPage] = useState(1);
    const [crmTotalPages, setCrmTotalPages] = useState(1);
    const [crmTotalRecords, setCrmTotalRecords] = useState(0);
    const [selectedCrmLog, setSelectedCrmLog] = useState(null);
    const [activeTab, setActiveTab] = useState("outbound"); // "outbound" or "inbound"

    // Selected event for attempt logs modal
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventLogs, setEventLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);

    // Load initial settings and webhook history
    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (activeTab === "outbound") {
            fetchWebhookHistory();
        } else {
            fetchCrmLogs();
        }
    }, [page, crmPage, activeTab]);

    const fetchSettings = async () => {
        try {
            const response = await api.get("/admin/helpdesk/settings");
            if (response.data.success) {
                setSettings(response.data.settings);
            }
        } catch (error) {
            console.error("Failed to load helpdesk settings:", error);
            toast.error("Failed to load integration settings.");
        } finally {
            setLoading(false);
        }
    };

    const fetchWebhookHistory = async () => {
        try {
            setEventsLoading(true);
            const response = await api.get("/admin/helpdesk/events", {
                params: { page, limit: 10 }
            });
            if (response.data.success) {
                setEvents(response.data.events);
                setTotalRecords(response.data.pagination.totalRecords);
                setTotalPages(response.data.pagination.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch webhook events history:", error);
        } finally {
            setEventsLoading(false);
        }
    };

    const fetchCrmLogs = async () => {
        try {
            setCrmLoading(true);
            const response = await api.get("/admin/helpdesk/crm-logs", {
                params: { page: crmPage, limit: 10 }
            });
            if (response.data.success) {
                setCrmLogs(response.data.logs);
                setCrmTotalRecords(response.data.pagination.totalRecords);
                setCrmTotalPages(response.data.pagination.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch CRM sync logs:", error);
        } finally {
            setCrmLoading(false);
        }
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setSettings((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const response = await api.put("/admin/helpdesk/settings", settings);
            if (response.data.success) {
                toast.success("Helpdesk integration settings saved!", {
                    theme: "colored",
                    transition: Bounce,
                    className: "font-black uppercase tracking-widest text-[10px] rounded-2xl"
                });
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Save configuration failed.");
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        try {
            setTesting(true);
            const response = await api.post("/admin/helpdesk/settings/test-connection", {
                helpdesk_url: settings.helpdesk_url,
                webhook_secret: settings.webhook_secret
            });
            if (response.data.success) {
                toast.success(response.data.message || "Connection test successful!", {
                    theme: "colored"
                });
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message || "Connection check failed.";
            toast.error(errorMsg, { theme: "colored" });
        } finally {
            setTesting(false);
        }
    };

    const viewLogs = async (event) => {
        setSelectedEvent(event);
        setEventLogs([]);
        try {
            setLogsLoading(true);
            const response = await api.get(`/admin/helpdesk/events/${event.eventId}/logs`);
            if (response.data.success) {
                setEventLogs(response.data.logs);
            }
        } catch (error) {
            toast.error("Failed to retrieve delivery logs.");
        } finally {
            setLogsLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "success":
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-wider text-[9px] rounded-full">Success</Badge>;
            case "pending":
                return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wider text-[9px] rounded-full">Pending</Badge>;
            case "retrying":
                return <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-bold uppercase tracking-wider text-[9px] rounded-full animate-pulse">Retrying</Badge>;
            case "failed":
                return <Badge className="bg-rose-500 hover:bg-rose-600 text-white font-bold uppercase tracking-wider text-[9px] rounded-full">Failed</Badge>;
            default:
                return <Badge className="bg-slate-400 text-white font-bold uppercase tracking-wider text-[9px] rounded-full">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center my-32">
                <Hamster />
                <p className="mt-6 text-sm font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Loading Integration parameters...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto py-8 px-4">
            <PageHeader
                title="Helpdesk Integration"
                description="Secure real-time customer data synchronization settings and logs."
                breadcrumbItems={[
                    { label: "Settings", href: `settings` },
                    { label: "Helpdesk Integration" }
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                
                {/* Configuration Panel */}
                <div className="lg:col-span-1">
                    <Card className="border-border shadow-xl bg-card rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-blue-500 to-indigo-600" />
                        <CardHeader>
                            <CardTitle className="text-lg font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
                                <Settings className="w-5 h-5 text-indigo-500" />
                                Credentials
                            </CardTitle>
                            <CardDescription className="text-slate-400 text-xs">
                                Configure endpoints and auth keys.
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="helpdesk_url" className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5" /> Helpdesk URL
                                    </Label>
                                    <Input
                                        id="helpdesk_url"
                                        placeholder="https://helpdesk.example.com/api/events"
                                        value={settings.helpdesk_url}
                                        onChange={handleChange}
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-border focus:ring-1 focus:ring-indigo-500"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="api_key" className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                                        <Key className="w-3.5 h-3.5" /> API Key (Incoming)
                                    </Label>
                                    <Input
                                        id="api_key"
                                        placeholder="BOP Access key for Helpdesk"
                                        value={settings.api_key}
                                        onChange={handleChange}
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-border focus:ring-1 focus:ring-indigo-500"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="webhook_secret" className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5" /> Webhook Secret
                                    </Label>
                                    <Input
                                        id="webhook_secret"
                                        placeholder="Webhook signing secret"
                                        value={settings.webhook_secret}
                                        onChange={handleChange}
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-border focus:ring-1 focus:ring-indigo-500"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="retry_count" className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                                        <RefreshCw className="w-3.5 h-3.5" /> Retry Count
                                    </Label>
                                    <Input
                                        id="retry_count"
                                        type="number"
                                        min="0"
                                        max="20"
                                        value={settings.retry_count}
                                        onChange={handleChange}
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-border focus:ring-1 focus:ring-indigo-500"
                                        required
                                    />
                                </div>

                                <div className="pt-2 flex flex-col gap-3">
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-primary/20"
                                    >
                                        {saving ? (
                                            <span className="flex items-center gap-2">
                                                <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                                            </span>
                                        ) : (
                                            "Save Integration"
                                        )}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleTestConnection}
                                        disabled={testing || !settings.helpdesk_url}
                                        className="w-full h-11 border-dashed hover:bg-slate-50 dark:hover:bg-slate-950 font-black uppercase tracking-wider rounded-xl transition-all"
                                    >
                                        {testing ? (
                                            <span className="flex items-center gap-2">
                                                <RefreshCw className="w-4 h-4 animate-spin" /> Testing...
                                            </span>
                                        ) : (
                                            "Connection Test"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Audit Trail Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-border shadow-xl bg-card rounded-2xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-indigo-500 to-purple-600" />
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div>
                                <CardTitle className="text-lg font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-purple-500" />
                                    Integration Audit Logs
                                </CardTitle>
                                <CardDescription className="text-slate-400 text-xs">
                                    Delivery status of outbound sync and processing status of inbound BOP events.
                                </CardDescription>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={activeTab === "outbound" ? fetchWebhookHistory : fetchCrmLogs} 
                                className="h-8 rounded-lg text-slate-500 dark:text-slate-400 font-bold"
                            >
                                <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
                            </Button>
                        </CardHeader>
                        
                        <CardContent>
                            {/* Tab Switcher */}
                            <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit border border-gray-100 dark:border-slate-800 shadow-inner mb-5">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("outbound")}
                                    className={cn(
                                        "rounded-lg px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-all",
                                        activeTab === "outbound"
                                            ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                                            : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                                    )}
                                >
                                    Outbound Webhooks
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("inbound")}
                                    className={cn(
                                        "rounded-lg px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-all",
                                        activeTab === "inbound"
                                            ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                                            : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                                    )}
                                >
                                    Inbound BOP Events
                                </button>
                            </div>

                            {activeTab === "outbound" ? (
                                <div className="rounded-xl border border-border overflow-hidden bg-slate-50/50 dark:bg-slate-950/20">
                                    <Table>
                                        <TableHeader className="bg-slate-100/80 dark:bg-slate-900/80 font-black text-xs">
                                            <TableRow>
                                                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Event</TableHead>
                                                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Customer ID</TableHead>
                                                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Attempts</TableHead>
                                                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Status</TableHead>
                                                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Timestamp</TableHead>
                                                <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {eventsLoading && events.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8">
                                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                                            <RefreshCw className="w-6 h-6 animate-spin" />
                                                            <span className="text-xs font-bold uppercase tracking-wider">Syncing log list...</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : events.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                                        <Database className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                                        No webhook events enqueued yet.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                events.map((event) => (
                                                    <TableRow key={event.eventId} className="hover:bg-slate-100/40 dark:hover:bg-slate-900/40 border-b border-border">
                                                        <TableCell className="font-black text-xs text-slate-700 dark:text-slate-300">
                                                            {event.eventType}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs text-indigo-500 font-bold">
                                                            {event.customerId}
                                                        </TableCell>
                                                        <TableCell className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                            {event.attempts}
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(event.status)}</TableCell>
                                                        <TableCell className="text-xs text-slate-400">
                                                            {new Date(event.createdAt).toLocaleTimeString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => viewLogs(event)}
                                                                className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-950 text-slate-500 rounded-lg"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-border overflow-hidden bg-slate-50/50 dark:bg-slate-950/20">
                                    <Table>
                                        <TableHeader className="bg-slate-100/80 dark:bg-slate-900/80 font-black text-xs">
                                            <TableRow>
                                                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Entity</TableHead>
                                                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Entity ID</TableHead>
                                                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Event ID</TableHead>
                                                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Status</TableHead>
                                                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Timestamp</TableHead>
                                                <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {crmLoading && crmLogs.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8">
                                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                                            <RefreshCw className="w-6 h-6 animate-spin" />
                                                            <span className="text-xs font-bold uppercase tracking-wider">Syncing log list...</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : crmLogs.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                                        <Database className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                                        No inbound BOP events logged yet.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                crmLogs.map((log) => (
                                                    <TableRow key={log.eventId} className="hover:bg-slate-100/40 dark:hover:bg-slate-900/40 border-b border-border">
                                                        <TableCell className="font-black text-xs text-slate-700 dark:text-slate-300 capitalize">
                                                            {log.entity}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs text-indigo-500 font-bold">
                                                            {log.entityId}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-slate-500 font-mono">
                                                            {log.eventId}
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                                                        <TableCell className="text-xs text-slate-400">
                                                            {new Date(log.receivedAt).toLocaleTimeString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setSelectedCrmLog(log)}
                                                                className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-950 text-slate-500 rounded-lg"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {/* Pagination */}
                            {activeTab === "outbound" && totalPages > 1 && (
                                <div className="flex items-center justify-between pt-5">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Total: {totalRecords} events
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                            disabled={page === 1}
                                            className="h-8 px-2.5 rounded-lg border-border"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <span className="text-xs font-black text-slate-700 dark:text-white">
                                            {page} / {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={page === totalPages}
                                            className="h-8 px-2.5 rounded-lg border-border"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {activeTab === "inbound" && crmTotalPages > 1 && (
                                <div className="flex items-center justify-between pt-5">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Total: {crmTotalRecords} events
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCrmPage(prev => Math.max(prev - 1, 1))}
                                            disabled={crmPage === 1}
                                            className="h-8 px-2.5 rounded-lg border-border"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <span className="text-xs font-black text-slate-700 dark:text-white">
                                            {crmPage} / {crmTotalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCrmPage(prev => Math.min(prev + 1, crmTotalPages))}
                                            disabled={crmPage === crmTotalPages}
                                            className="h-8 px-2.5 rounded-lg border-border"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Diagnostic Logs Modal */}
            <Dialog open={selectedEvent !== null} onOpenChange={() => setSelectedEvent(null)}>
                <DialogContent className="max-w-[700px] rounded-2xl border-border shadow-2xl overflow-hidden bg-card text-slate-950 dark:text-white p-0">
                    <div className="h-[4px] bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 w-full" />
                    
                    <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
                        <DialogTitle className="text-lg font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
                            <Info className="w-5 h-5 text-indigo-500" />
                            Webhook Transmission Audit logs
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs">
                            Delivery trace entries for Event ID: <span className="font-mono text-indigo-500 font-bold">{selectedEvent?.eventId}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 max-h-[450px] overflow-y-auto space-y-4">
                        {logsLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                                <RefreshCw className="w-6 h-6 animate-spin" />
                                <span className="text-xs font-bold uppercase tracking-wider">Retrieving audit trace...</span>
                            </div>
                        ) : eventLogs.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase">
                                No send logs recorded for this event yet.
                            </div>
                        ) : (
                            eventLogs.map((log, index) => (
                                <Card key={log.logId} className="border-border bg-slate-50/50 dark:bg-slate-950/40 rounded-xl overflow-hidden">
                                    <div className="bg-slate-100/80 dark:bg-slate-900/80 px-4 py-2 border-b border-border flex items-center justify-between">
                                        <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                            Attempt #{log.attempt}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {new Date(log.deliveredAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <CardContent className="p-4 space-y-3">
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div>
                                                <span className="font-bold text-slate-400 block uppercase text-[10px]">Method/URL</span>
                                                <span className="font-mono text-slate-700 dark:text-slate-300 break-all">POST {log.requestUrl}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-400 block uppercase text-[10px]">HTTP Status</span>
                                                <span className="font-bold">
                                                    {log.responseStatus ? (
                                                        <span className={cn(
                                                            log.responseStatus >= 200 && log.responseStatus < 300 ? "text-emerald-500" : "text-rose-500"
                                                        )}>
                                                            {log.responseStatus}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">--</span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {log.errorMessage && (
                                            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-950/50 rounded-lg text-xs text-red-600 dark:text-red-400">
                                                <span className="font-black uppercase text-[9px] tracking-wider block mb-1">Network Error</span>
                                                {log.errorMessage}
                                            </div>
                                        )}

                                        {log.responseBody && (
                                            <div className="space-y-1">
                                                <span className="font-bold text-slate-400 block uppercase text-[10px]">Response Payload</span>
                                                <pre className="p-3 bg-slate-950 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto max-h-[120px] whitespace-pre-wrap">
                                                    {log.responseBody}
                                                </pre>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* CRM Event Detail Modal */}
            <Dialog open={selectedCrmLog !== null} onOpenChange={() => setSelectedCrmLog(null)}>
                <DialogContent className="max-w-[600px] rounded-2xl border-border shadow-2xl overflow-hidden bg-card text-slate-950 dark:text-white p-0">
                    <div className="h-[4px] bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 w-full" />
                    
                    <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
                        <DialogTitle className="text-lg font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
                            <Info className="w-5 h-5 text-indigo-500" />
                            BOP Event Processing Audit
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs">
                            Audit entry for Event ID: <span className="font-mono text-indigo-500 font-bold">{selectedCrmLog?.eventId}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <span className="font-bold text-slate-400 block uppercase text-[10px]">Entity Type</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{selectedCrmLog?.entity}</span>
                            </div>
                            <div>
                                <span className="font-bold text-slate-400 block uppercase text-[10px]">Entity ID</span>
                                <span className="font-mono text-indigo-500 font-semibold">{selectedCrmLog?.entityId}</span>
                            </div>
                            <div>
                                <span className="font-bold text-slate-400 block uppercase text-[10px]">Received At</span>
                                <span className="text-slate-600 dark:text-slate-400">{selectedCrmLog?.receivedAt ? new Date(selectedCrmLog.receivedAt).toLocaleString() : '--'}</span>
                            </div>
                            <div>
                                <span className="font-bold text-slate-400 block uppercase text-[10px]">Processed At</span>
                                <span className="text-slate-600 dark:text-slate-400">{selectedCrmLog?.processedAt ? new Date(selectedCrmLog.processedAt).toLocaleString() : '--'}</span>
                            </div>
                        </div>

                        {selectedCrmLog?.errors && (
                            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-950/50 rounded-xl text-xs text-red-600 dark:text-red-400 space-y-1">
                                <span className="font-black uppercase text-[9px] tracking-wider block">Error Message</span>
                                <p className="font-mono whitespace-pre-wrap">{selectedCrmLog.errors}</p>
                            </div>
                        )}

                        {!selectedCrmLog?.errors && (
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-950/50 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-semibold">Event processed successfully without errors.</span>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default HelpdeskSettings;
