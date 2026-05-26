import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import api from "@/lib/axiosInstance";
import {
  Wrench,
  ArrowLeft,
  Loader2,
  Mail,
  FileText,
  Clock,
  Database,
  CheckCircle2,
  XCircle,
  Terminal,
  Send,
  Calendar,
  User,
  Activity,
  ChevronLeft,
  Server
} from "lucide-react";

import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Breadcrumb } from "@/components/ui/breadcrumb.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select.jsx";
import { motion, AnimatePresence } from "framer-motion";

const DeveloperControls = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [users, setUsers] = useState([]);
  
  // Tab Selection
  const [activeTab, setActiveTab] = useState("email"); // "email" | "dcr" | "timetracking"

  // Action States
  const [submitting, setSubmitting] = useState(false);
  const [responseLog, setResponseLog] = useState(null);

  // Form States
  const [emailForm, setEmailForm] = useState({
    username: "",
    email: ""
  });
  const [dcrForm, setDcrForm] = useState({
    date: new Date().toISOString().split("T")[0],
    overrideRecipient: ""
  });
  const [timeForm, setTimeForm] = useState({
    username: "",
    date: new Date().toISOString().split("T")[0]
  });

  // Fetch initial data
  useEffect(() => {
    fetchSystemInfo();
    fetchUsers();
  }, []);

  const fetchSystemInfo = async () => {
    setLoadingInfo(true);
    try {
      const res = await api.get("/admin/dev/system-info");
      if (res.data?.success) {
        setSystemInfo(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to load server diagnostics");
    } finally {
      setLoadingInfo(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get("/users");
      // filter only active users or sort
      setUsers(res.data || []);
    } catch (err) {
      toast.error("Failed to load users list");
    } finally {
      setLoadingUsers(false);
    }
  };

  // Submit test email
  const handleTestEmailSubmit = async (e) => {
    e.preventDefault();
    const targetUsername = emailForm.username === "none" ? "" : emailForm.username;
    if (!targetUsername && !emailForm.email) {
      toast.warn("Please select a user or enter a custom email address");
      return;
    }
    setSubmitting(true);
    setResponseLog(null);
    try {
      const res = await api.post("/admin/dev/test-email", {
        username: targetUsername,
        email: emailForm.email
      });
      setResponseLog(res.data);
      toast.success(res.data.message || "Test email dispatched successfully!");
    } catch (err) {
      setResponseLog(err.response?.data || { error: err.message });
      toast.error(err.response?.data?.message || "Failed to send test email");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit DCR trigger
  const handleDcrSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResponseLog(null);
    try {
      const res = await api.post("/admin/dev/trigger-dcr", dcrForm);
      setResponseLog(res.data);
      toast.success(res.data.message || "DCR report triggered successfully!");
    } catch (err) {
      setResponseLog(err.response?.data || { error: err.message });
      toast.error(err.response?.data?.message || "Failed to trigger DCR report");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Time Tracking trigger
  const handleTimeSubmit = async (e) => {
    e.preventDefault();
    if (!timeForm.username) {
      toast.warn("Please select a target user for the report");
      return;
    }
    setSubmitting(true);
    setResponseLog(null);
    try {
      const res = await api.post("/admin/dev/trigger-time-tracking", timeForm);
      setResponseLog(res.data);
      toast.success(res.data.message || "Time tracking report generated!");
    } catch (err) {
      setResponseLog(err.response?.data || { error: err.message });
      toast.error(err.response?.data?.message || "Failed to trigger time tracking report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-b from-background to-muted/20 min-h-screen w-full">
      <div className="max-w-6xl mx-auto space-y-6 w-full">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Breadcrumb
              items={[
                { label: "Settings", href: `/${location.pathname.split('/')[1]}/dashboard/settings` },
                { label: "Developer Controls" }
              ]}
              className="mb-4"
            />
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Wrench className="w-8 h-8 text-primary" /> Developer Diagnostics & Controls
            </h1>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="rounded-xl hover:bg-muted group"
          >
            <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to settings
          </Button>
        </div>

        {/* Server Diagnostics Area */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
          
          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" /> Database Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingInfo ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Querying...</div>
              ) : systemInfo?.database ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-lg font-bold">{systemInfo.database.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Latency: <span className="font-semibold">{systemInfo.database.latencyMs}ms</span></p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-red-500"><XCircle className="w-4 h-4" /> Disconnected</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-500" /> Mail Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingInfo ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Querying...</div>
              ) : systemInfo?.mail ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-none font-bold uppercase tracking-wider text-[10px]">
                      {systemInfo.mail.provider}
                    </Badge>
                    {systemInfo.mail.configured ? (
                      <span className="text-xs font-semibold text-emerald-600">Configured</span>
                    ) : (
                      <span className="text-xs font-semibold text-red-500">Unconfigured</span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate" title={systemInfo.mail.fromEmail || systemInfo.mail.host}>
                    {systemInfo.mail.provider === 'sendgrid' ? `Sender: ${systemInfo.mail.fromEmail}` : `Host: ${systemInfo.mail.host}`}
                  </p>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Unknown</span>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> Server Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingInfo ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Querying...</div>
              ) : systemInfo ? (
                <div className="space-y-1">
                  <span className="text-sm font-bold block truncate">
                    {new Date(systemInfo.serverTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                  </span>
                  <p className="text-[10px] text-muted-foreground truncate">{systemInfo.serverTimezone}</p>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Unknown</span>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-card/50 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-500" /> Platform Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingInfo ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Querying...</div>
              ) : systemInfo ? (
                <div className="space-y-0.5">
                  <div className="text-[11px] font-semibold">Node: <span className="text-muted-foreground">{systemInfo.nodeVersion}</span></div>
                  <div className="text-[11px] font-semibold">Env: <span className="text-muted-foreground capitalize">{systemInfo.envMode}</span></div>
                  <div className="text-[11px] font-semibold">Port: <span className="text-muted-foreground">{systemInfo.port}</span></div>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Unknown</span>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Task Trigger & Form Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
          
          {/* Left panel: Trigger Forms */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-none shadow-lg bg-card/50 backdrop-blur-xl">
              
              {/* Tab Selector Header */}
              <div className="flex border-b border-border/50">
                <button
                  onClick={() => { setActiveTab("email"); setResponseLog(null); }}
                  className={`flex-1 py-4 px-6 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-b-2 ${
                    activeTab === "email" 
                      ? "border-primary text-primary bg-primary/5" 
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Mail className="w-4 h-4" /> Mail Diagnostics
                </button>
                <button
                  onClick={() => { setActiveTab("dcr"); setResponseLog(null); }}
                  className={`flex-1 py-4 px-6 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-b-2 ${
                    activeTab === "dcr" 
                      ? "border-primary text-primary bg-primary/5" 
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="w-4 h-4" /> DCR Reports
                </button>
                <button
                  onClick={() => { setActiveTab("timetracking"); setResponseLog(null); }}
                  className={`flex-1 py-4 px-6 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-b-2 ${
                    activeTab === "timetracking" 
                      ? "border-primary text-primary bg-primary/5" 
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Clock className="w-4 h-4" /> Time Tracking
                </button>
              </div>

              <CardContent className="p-8">
                <AnimatePresence mode="wait">
                  
                  {/* SMTP/Mail Form */}
                  {activeTab === "email" && (
                    <motion.form
                      key="email-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onSubmit={handleTestEmailSubmit}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <h3 className="text-base font-bold">Mail Delivery Tester</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Send a curated test email layout via SendGrid or SMTP to verify that the email dispatch pipeline functions properly. You can either select an existing user or type a custom address.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select User</Label>
                          <Select
                            value={emailForm.username}
                            onValueChange={(val) => setEmailForm(f => ({ ...f, username: val, email: "" }))}
                          >
                            <SelectTrigger className="h-11 border-border/50 bg-background/50 focus:bg-background transition-all">
                              <SelectValue placeholder={loadingUsers ? "Loading users list..." : "Choose user profile..."} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl max-h-60">
                              <SelectItem value="none" className="italic text-muted-foreground">None (Use custom email below)</SelectItem>
                              {users.map(u => (
                                <SelectItem key={u.username} value={u.username} className="rounded-lg">
                                  {u.name} (@{u.username}) — {u.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="relative flex items-center justify-center py-2">
                          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/40" /></div>
                          <span className="relative bg-card px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">OR</span>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="custom-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Custom Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="custom-email"
                              type="email"
                              placeholder="test@example.com"
                              value={emailForm.email}
                              onChange={(e) => setEmailForm(f => ({ ...f, email: e.target.value, username: "" }))}
                              className="pl-10 h-11 border-border/50 bg-background/50 focus:bg-background transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-tight shadow-md flex items-center justify-center gap-2 transition-all"
                      >
                        {submitting ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Dispatched...</>
                        ) : (
                          <><Send className="w-4 h-4" /> Trigger Test Email</>
                        )}
                      </Button>
                    </motion.form>
                  )}

                  {/* DCR Report Trigger */}
                  {activeTab === "dcr" && (
                    <motion.form
                      key="dcr-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onSubmit={handleDcrSubmit}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <h3 className="text-base font-bold">Manual DCR Report Dispatch</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Manually execute the DCR generation script for a target date. The server will compile call summaries, build performance breakdown charts, and send them.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="dcr-date" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Date</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="dcr-date"
                              type="date"
                              value={dcrForm.date}
                              onChange={(e) => setDcrForm(f => ({ ...f, date: e.target.value }))}
                              className="pl-10 h-11 border-border/50 bg-background/50 focus:bg-background transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dcr-recipient" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recipient Override (Optional)</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="dcr-recipient"
                              type="email"
                              placeholder="Defaults to DCR_DAILY_REPORT_TO"
                              value={dcrForm.overrideRecipient}
                              onChange={(e) => setDcrForm(f => ({ ...f, overrideRecipient: e.target.value }))}
                              className="pl-10 h-11 border-border/50 bg-background/50 focus:bg-background transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-tight shadow-md flex items-center justify-center gap-2 transition-all"
                      >
                        {submitting ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Compiling & Sending...</>
                        ) : (
                          <><Activity className="w-4 h-4" /> Trigger Daily DCR Report</>
                        )}
                      </Button>
                    </motion.form>
                  )}

                  {/* Time Tracking Report Trigger */}
                  {activeTab === "timetracking" && (
                    <motion.form
                      key="time-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onSubmit={handleTimeSubmit}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <h3 className="text-base font-bold">Individual User Time Report</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Force trigger the daily time tracking email for a selected employee. The system gathers project allocations and tasks, generates charts, and sends a breakdown to the employee.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target User</Label>
                          <Select
                            value={timeForm.username}
                            onValueChange={(val) => setTimeForm(f => ({ ...f, username: val }))}
                          >
                            <SelectTrigger className="h-11 border-border/50 bg-background/50 focus:bg-background transition-all">
                              <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select user..."} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl max-h-60">
                              {users.map(u => (
                                <SelectItem key={u.username} value={u.username} className="rounded-lg">
                                  {u.name} (@{u.username})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="time-date" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Report Date</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="time-date"
                              type="date"
                              value={timeForm.date}
                              onChange={(e) => setTimeForm(f => ({ ...f, date: e.target.value }))}
                              className="pl-10 h-11 border-border/50 bg-background/50 focus:bg-background transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-tight shadow-md flex items-center justify-center gap-2 transition-all"
                      >
                        {submitting ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                        ) : (
                          <><Clock className="w-4 h-4" /> Trigger Time Tracking Email</>
                        )}
                      </Button>
                    </motion.form>
                  )}

                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Right panel: Live Logs / Console Output */}
          <div className="lg:col-span-4 flex flex-col h-full">
            <Card className="border-none shadow-lg bg-slate-950 text-slate-100 flex-1 overflow-hidden rounded-2xl flex flex-col min-h-[420px] max-h-[500px]">
              <CardHeader className="border-b border-slate-800 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-primary" /> Console Logs Output
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-400 font-bold uppercase tracking-wider">
                  {submitting ? "Processing" : responseLog ? "Response Ready" : "Idle"}
                </Badge>
              </CardHeader>
              <CardContent className="p-6 flex-1 overflow-y-auto font-mono text-xs leading-relaxed space-y-4">
                
                {submitting && (
                  <div className="flex flex-col items-center justify-center h-full space-y-3 text-slate-400 py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="animate-pulse">Awaiting response from backend service...</p>
                  </div>
                )}

                {!submitting && !responseLog && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12 text-center">
                    <Terminal className="w-10 h-10 mb-3 opacity-30" />
                    <p>Trigger an action to inspect the server response payload logs here.</p>
                  </div>
                )}

                {!submitting && responseLog && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="font-bold text-[10px] text-slate-400">STATUS CODE</span>
                      <span className={`font-bold ${responseLog.success !== false ? 'text-primary' : 'text-destructive'}`}>
                        {responseLog.success !== false ? '200 OK' : '500 ERROR'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-[10px] text-slate-400 block">RAW RESPONSE DATA</span>
                      <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl overflow-x-auto text-[11px] max-h-[300px] text-emerald-400">
                        {JSON.stringify(responseLog, null, 2)}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
};

export default DeveloperControls;
