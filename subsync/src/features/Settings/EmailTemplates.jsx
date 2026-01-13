import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";
import { cn } from "@/lib/utils";
import {
  Loader2, Mail, Plus, Trash2, Save, X, Eye, Search,
  AlertCircle, FileCode, Type, Code, MousePointerClick
} from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Checkbox } from "@/components/ui/checkbox.jsx";

const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    id: null,
    template_key: "",
    name: "",
    subject: "",
    body_html: "",
    active: true,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.EMAIL_TEMPLATES_CREATE);
  const canUpdate = hasPermission(PERMISSIONS.EMAIL_TEMPLATES_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.EMAIL_TEMPLATES_DELETE);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/email-templates");
      setTemplates(response.data || []);

      if (response.data?.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(response.data[0].id);
        loadTemplate(response.data[0]);
      }
    } catch (error) {
      toast.error("Failed to load email templates");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (template) => {
    setTemplateForm({
      id: template.id,
      template_key: template.template_key,
      name: template.name,
      subject: template.subject,
      body_html: template.body_html,
      active: template.active,
    });
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplateId(template.id);
    loadTemplate(template);
  };

  const handleNewTemplate = () => {
    setSelectedTemplateId("new");
    setTemplateForm({
      id: null,
      template_key: "",
      name: "",
      subject: "",
      body_html: "",
      active: true,
    });
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.template_key.trim() || !templateForm.name.trim() || !templateForm.subject.trim() || !templateForm.body_html.trim()) {
      toast.error("All fields are required");
      return;
    }

    setSaving(true);
    try {
      if (templateForm.id) {
        await api.put(`/email-templates/${templateForm.id}`, templateForm);
        toast.success("Email template updated successfully");
      } else {
        const res = await api.post("/email-templates", templateForm);
        toast.success("Email template created successfully");
        if (res.data && res.data.id) {
          setSelectedTemplateId(res.data.id);
          setTemplateForm(prev => ({ ...prev, id: res.data.id }));
        }
      }
      await fetchData();
      // If we just created a new one, ensure we stay on it or refresh the list correctly
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save email template");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (template) => {
    try {
      await api.delete(`/email-templates/${template.id}`);
      toast.success("Email template deleted successfully");
      setShowDeleteConfirm(null);

      const remaining = templates.filter(t => t.id !== template.id);
      if (remaining.length > 0) {
        setSelectedTemplateId(remaining[0].id);
        loadTemplate(remaining[0]);
      } else {
        setSelectedTemplateId(null);
        handleNewTemplate();
      }
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete email template");
    }
  };

  const handlePreview = async () => {
    if (!templateForm.id) {
      // Mock preview for unsaved or new templates if needed, or just warn
      if (!templateForm.body_html) {
        toast.error("Please add content to preview");
        return;
      }
      setPreviewData({
        subject: templateForm.subject || "No Subject",
        html: templateForm.body_html
      });
      setShowPreviewDialog(true);
      return;
    }

    setPreviewLoading(true);
    try {
      const response = await api.post(`/email-templates/${templateForm.id}/preview`, {});
      setPreviewData(response.data);
      setShowPreviewDialog(true);
    } catch (error) {
      toast.error("Failed to preview template");
      console.error(error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.template_key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar List */}
      <aside className="w-full md:w-96 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <h2 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Library
              </h2>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                Templates
              </h1>
            </div>
            {canCreate && (
              <Button
                size="sm"
                onClick={handleNewTemplate}
                className="h-10 w-10 p-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter templates..."
              className="pl-10 h-12 bg-slate-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <span className="text-xs uppercase tracking-widest font-bold">Syncing...</span>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">No Match Found</p>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className={cn(
                  "group p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 relative overflow-hidden",
                  selectedTemplateId === template.id
                    ? "bg-white dark:bg-slate-800/80 border-blue-600 dark:border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02]"
                    : "bg-white dark:bg-slate-900 border-transparent hover:border-gray-100 dark:hover:border-slate-800 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20"
                )}
              >
                {/* Active Indicator Dot */}
                <div className={cn(
                  "absolute top-4 right-4 w-2 h-2 rounded-full",
                  template.active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-slate-300 dark:bg-slate-700"
                )} />

                <h3 className={cn(
                  "font-black text-sm mb-1 pr-6 truncate",
                  selectedTemplateId === template.id ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"
                )}>
                  {template.name}
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 truncate">
                  {template.template_key}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-md px-2 py-0 h-5 text-[9px] font-black uppercase tracking-wider border-gray-100 dark:border-slate-700 text-slate-400">
                    HTML
                  </Badge>
                  {selectedTemplateId === template.id && (
                    <motion.span
                      layoutId="activeText"
                      className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400"
                    >
                      Editing
                    </motion.span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Content / Editor */}
      <main className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
        {(selectedTemplateId || selectedTemplateId === 'new') ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <header className="px-10 py-8 border-b border-gray-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl z-20 shrink-0">
              <div className="flex items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-none shadow-sm",
                      templateForm.active
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                    )}>
                      {templateForm.active ? "Active Template" : "Draft / Inactive"}
                    </Badge>
                    {templateForm.id === null && (
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-none">
                        New Draft
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {templateForm.name || "Untitled Template"}
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={handlePreview}
                    className="hidden md:flex bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-gray-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl px-5 h-12 font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  {canDelete && templateForm.id && (
                    <Button
                      variant="ghost"
                      onClick={() => setShowDeleteConfirm({ id: templateForm.id, name: templateForm.name })}
                      className="h-12 w-12 p-0 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  )}
                  {(canUpdate || canCreate) && (
                    <Button
                      onClick={handleSaveTemplate}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/25 active:scale-95 transition-all"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </header>

            {/* Editor Form */}
            <div className="flex-1 overflow-y-auto p-10 scrollbar-thin">
              <div className="max-w-5xl mx-auto space-y-12 pb-20">
                {/* Meta Section */}
                <section className="grid md:grid-cols-2 gap-8 p-1">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      <Code className="w-3 h-3" />
                      System Key
                    </Label>
                    <Input
                      value={templateForm.template_key}
                      onChange={(e) => setTemplateForm({ ...templateForm, template_key: e.target.value })}
                      disabled={!!templateForm.id}
                      placeholder="e.g. SUBSCRIPTION_EXPIRING_SOON"
                      className="h-16 font-mono text-xs bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 font-medium tracking-wide shadow-sm"
                    />
                    <p className="text-[10px] font-medium text-slate-400 px-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Used by the system to trigger this email. Must be unique.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      <Type className="w-3 h-3" />
                      Internal Name
                    </Label>
                    <Input
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      placeholder="e.g. Expiry Warning (30 Days)"
                      className="h-16 bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 text-lg font-bold shadow-sm"
                    />
                  </div>
                </section>

                {/* Content Section */}
                <section className="space-y-8 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      <Mail className="w-3 h-3" />
                      Subject Line
                    </Label>
                    <Input
                      value={templateForm.subject}
                      onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                      placeholder="Enter a compelling subject..."
                      className="h-16 bg-slate-50 dark:bg-slate-950 border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 text-lg font-medium transition-all"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <FileCode className="w-3 h-3" />
                        HTML Content
                      </Label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handlePreview}
                          className="h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 text-slate-500 hover:text-blue-600 transition-all font-black text-[10px] uppercase tracking-widest"
                        >
                          <Eye className="w-3.5 h-3.5 mr-2" />
                          Instant Preview
                        </Button>
                        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-gray-100 dark:border-slate-800 cursor-pointer hover:border-blue-500/30 transition-colors">
                          <Checkbox
                            id="active-toggle"
                            checked={templateForm.active}
                            onCheckedChange={(checked) => setTemplateForm({ ...templateForm, active: checked })}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 w-4 h-4 rounded-md"
                          />
                          <Label htmlFor="active-toggle" className="text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer">
                            Enable Template
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <Textarea
                        value={templateForm.body_html}
                        onChange={(e) => setTemplateForm({ ...templateForm, body_html: e.target.value })}
                        className="min-h-[500px] font-mono text-sm bg-slate-900 text-slate-300 dark:bg-slate-950/50 dark:text-slate-300 rounded-3xl p-6 border-none focus:ring-0 leading-relaxed resize-y"
                        style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
                        placeholder="<html>&#10;  <body>&#10;    <h1>Hello {{customer_name}}!</h1>&#10;  </body>&#10;</html>"
                      />
                      <div className="absolute top-4 right-6">
                        <Badge variant="outline" className="bg-white/10 text-white/50 border-white/10 text-[9px] font-black uppercase tracking-widest backdrop-blur-md">
                          Handlebars Supported
                        </Badge>
                      </div>
                    </div>

                    <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                        <MousePointerClick className="w-3 h-3" />
                        Available Variables
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {['customer_name', 'subscription_id', 'domain_name', 'days_left', 'end_date', 'total', 'items_table_html', 'renewal_link'].map(v => (
                          <code key={v} className="bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-800 px-2 py-1 rounded-md text-[10px] text-slate-500 dark:text-slate-400 font-bold font-mono">
                            {`{{${v}}}`}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
            <div className="w-32 h-32 bg-slate-100 dark:bg-slate-900 rounded-[3rem] flex items-center justify-center mb-6 text-slate-300 dark:text-slate-700">
              <Mail className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">No Selection</h3>
            <p className="max-w-xs mx-auto text-sm font-medium text-slate-500 leading-relaxed">
              Select a template from the library or create a new one to begin editing.
            </p>
          </div>
        )}
      </main>

      {/* Delete Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900">
          <div className="p-10 bg-red-600">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-6">
              <Trash2 className="w-10 h-10 text-white" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-white mb-2 tracking-tight">Delete Template?</DialogTitle>
              <DialogDescription className="text-red-100 text-sm font-medium leading-relaxed opacity-90">
                This will permanently delete <span className="font-black text-white underline decoration-2 underline-offset-4">"{showDeleteConfirm?.name}"</span>. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="p-10 pt-0 flex-col sm:flex-row gap-4">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(null)}
              className="rounded-2xl h-14 flex-1 font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleDeleteTemplate(showDeleteConfirm)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-14 flex-1 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-red-500/30 active:scale-95 transition-all"
            >
              Delete It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-5xl h-[85vh] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-950 flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Email Preview</h3>
              {previewData && <p className="text-sm text-slate-500 font-medium">Subject: <span className="text-slate-900 dark:text-slate-300 font-bold">{previewData.subject}</span></p>}
            </div>
            <Button variant="ghost" className="h-10 w-10 rounded-full p-0" onClick={() => setShowPreviewDialog(false)}>
              <X className="w-5 h-5 text-slate-400" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900/50 p-8 shadow-inner">
            {previewLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p className="text-xs font-black uppercase tracking-widest">Rendering Preview...</p>
              </div>
            ) : previewData ? (
              <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden min-h-[500px]">
                <div dangerouslySetInnerHTML={{ __html: previewData.html }} className="p-0" />
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default EmailTemplates;
