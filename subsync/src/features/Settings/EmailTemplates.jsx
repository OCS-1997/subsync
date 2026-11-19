import { useEffect, useState, useRef } from "react";
import { toast } from '@/utils/toast';
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
  AlertCircle, FileCode, Type, Code, MousePointerClick, Copy, GripVertical,
  ChevronDown, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Checkbox } from "@/components/ui/checkbox.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";

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
  const [activeTarget, setActiveTarget] = useState('subject'); // 'subject' | 'body'

  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.EMAIL_TEMPLATES_CREATE);
  const canUpdate = hasPermission(PERMISSIONS.EMAIL_TEMPLATES_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.EMAIL_TEMPLATES_DELETE);

  const subjectInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Available template variables with descriptions and subject-friendliness
  const AVAILABLE_VARIABLES = [
    { key: 'domain_name', label: 'Domain Name', description: 'Domain or service name (e.g., example.com)', subjectPopular: true },
    { key: 'customer_name', label: 'Customer Name', description: 'Customer full name', subjectPopular: true },
    { key: 'subscription_id', label: 'Subscription ID', description: 'Subscription ID (e.g., SUB123456)', subjectPopular: true },
    { key: 'days_left', label: 'Days Left', description: 'Days until expiry (or negative if expired)', subjectPopular: true },
    { key: 'end_date', label: 'Expiry Date', description: 'Subscription end/expiry date', subjectPopular: true },
    { key: 'start_date', label: 'Start Date', description: 'Subscription start date' },
    { key: 'total', label: 'Total Amount', description: 'Total subscription amount', subjectPopular: true },
    { key: 'currency', label: 'Currency', description: 'Currency symbol (₹, $, etc.)' },
    { key: 'company_name', label: 'Company Name', description: 'Your company name', subjectPopular: true },
    { key: 'support_email', label: 'Support Email', description: 'Support email address' },
    { key: 'renewal_link', label: 'Renewal Link', description: 'Link for customer to renew subscription' },
    { key: 'current_year', label: 'Current Year', description: 'Current year (for copyright)' },
    { key: 'items_table_html', label: 'Invoice Table', description: 'HTML table of subscription services/items' },
  ];

  // Helper to render live subject preview with realistic mock data
  const renderSubjectPreview = (subject) => {
    if (!subject || !subject.trim()) return "Enter a subject line to preview";
    const sampleMap = {
      domain_name: 'example.com',
      domain: 'example.com',
      customer_name: 'John Doe',
      client_name: 'John Doe',
      name: 'John Doe',
      subscription_id: 'SUB001',
      sub_id: 'SUB001',
      days_left: '30',
      days_remaining: '30',
      days: '30',
      end_date: '31/12/2026',
      expiry_date: '31/12/2026',
      due_date: '31/12/2026',
      start_date: '01/01/2026',
      company_name: 'Online Consultancy Services',
      company: 'Online Consultancy Services',
      currency: '₹',
      total: '1,180.00',
      amount: '1,180.00',
      support_email: 'support@subsync.example.com',
      current_year: new Date().getFullYear(),
    };
    return subject.replace(/\{\{?\s*([a-zA-Z0-9_]+)\s*\}\}?/g, (match, key) => {
      return sampleMap[key] !== undefined ? sampleMap[key] : match;
    });
  };

  // Insert variable into either subject or body at cursor position
  const insertVariable = (varKey, explicitTarget = null) => {
    const target = explicitTarget || activeTarget || 'subject';
    const tag = `{{${varKey}}}`;

    if (target === 'subject') {
      const input = subjectInputRef.current;
      if (!input) {
        setTemplateForm(prev => ({
          ...prev,
          subject: (prev.subject ? prev.subject + ' ' : '') + tag
        }));
        toast.success(`Inserted ${tag} into Subject`);
        return;
      }

      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      const text = templateForm.subject || '';
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + tag + after;

      setTemplateForm(prev => ({ ...prev, subject: newText }));
      toast.success(`Inserted ${tag} into Subject`);

      setTimeout(() => {
        input.focus();
        const newPos = start + tag.length;
        input.setSelectionRange(newPos, newPos);
      }, 0);
    } else {
      const textarea = textareaRef.current;
      if (!textarea) {
        setTemplateForm(prev => ({
          ...prev,
          body_html: (prev.body_html || '') + tag
        }));
        toast.success(`Inserted ${tag} into Body`);
        return;
      }

      const start = textarea.selectionStart ?? textarea.value.length;
      const end = textarea.selectionEnd ?? textarea.value.length;
      const text = templateForm.body_html || '';
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + tag + after;

      setTemplateForm(prev => ({ ...prev, body_html: newText }));
      toast.success(`Inserted ${tag} into Body`);

      setTimeout(() => {
        textarea.focus();
        const newPos = start + tag.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    }
  };

  // Copy all variables formatted for AI prompt
  const copyAllVariables = () => {
    const formatted = AVAILABLE_VARIABLES.map(v =>
      `{{${v.key}}} - ${v.description}`
    ).join('\n');

    const fullText = `Available Email Template Variables:\n\n${formatted}\n\nNote: Use {{variable_name}} syntax in Handlebars templates. For conditionals use {{#if variable_name}}...{{/if}}. For HTML output use triple braces: {{{items_table_html}}}`;

    navigator.clipboard.writeText(fullText).then(() => {
      toast.success('All variables copied! Paste into AI for template generation.');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

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
    setPreviewLoading(true);
    setShowPreviewDialog(true);
    try {
      const endpoint = (templateForm.id && templateForm.id !== 'new')
        ? `/email-templates/${templateForm.id}/preview`
        : `/email-templates/preview`;
      const response = await api.post(endpoint, {
        subject: templateForm.subject,
        body_html: templateForm.body_html,
        template_key: templateForm.template_key
      });
      setPreviewData(response.data);
    } catch (error) {
      console.error("Preview error:", error);
      setPreviewData({
        subject: renderSubjectPreview(templateForm.subject) || "No Subject",
        html: templateForm.body_html || "<p style='color: #888; font-style: italic;'>No content to preview</p>",
        context: {
          customer_name: 'John Doe',
          customer_email: 'customer@example.com',
          domain_name: 'example.com',
        }
      });
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

                {/* Subject Line Section */}
                <section className="space-y-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <Mail className="w-3.5 h-3.5 text-blue-500" />
                        Subject Line
                      </Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Use variables like <code className="text-blue-600 dark:text-blue-400 font-mono font-bold">{"{{domain_name}}"}</code> to dynamically personalize the email subject.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3.5 rounded-xl border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-wider hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Insert Variable
                            <ChevronDown className="w-3 h-3 opacity-60" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-y-auto rounded-xl p-1.5">
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-400 px-2 py-1">
                            Click to insert into Subject
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {AVAILABLE_VARIABLES.filter(v => v.key !== 'items_table_html').map((v) => (
                            <DropdownMenuItem
                              key={v.key}
                              onClick={() => insertVariable(v.key, 'subject')}
                              className="flex items-center justify-between py-2 px-2.5 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            >
                              <div className="flex flex-col pr-2">
                                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{v.label}</span>
                                <span className="text-[10px] text-slate-400 line-clamp-1">{v.description}</span>
                              </div>
                              <Badge variant="secondary" className="font-mono text-[9px] shrink-0 bg-blue-100/70 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                {`{{${v.key}}}`}
                              </Badge>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="relative group">
                    <Input
                      ref={subjectInputRef}
                      value={templateForm.subject}
                      onFocus={() => setActiveTarget('subject')}
                      onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                      onDrop={(e) => {
                        e.preventDefault();
                        const data = e.dataTransfer.getData("text/plain");
                        if (!data) return;
                        const input = subjectInputRef.current;
                        const start = input?.selectionStart ?? (templateForm.subject || '').length;
                        const end = input?.selectionEnd ?? (templateForm.subject || '').length;
                        const text = templateForm.subject || '';
                        const newText = text.substring(0, start) + data + text.substring(end);
                        setTemplateForm(prev => ({ ...prev, subject: newText }));
                        toast.success(`Inserted ${data} into subject`);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      placeholder="e.g. Action Required: Renewal for {{domain_name}} - {{days_left}} days remaining"
                      className="h-16 bg-slate-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 text-base md:text-lg font-medium transition-all shadow-sm"
                    />
                  </div>

                  {/* Quick-Add Subject Variable Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Quick Add to Subject:
                    </span>
                    {AVAILABLE_VARIABLES.filter(v => v.subjectPopular).map(v => (
                      <button
                        key={v.key}
                        type="button"
                        draggable="true"
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", `{{${v.key}}}`);
                        }}
                        onClick={() => insertVariable(v.key, 'subject')}
                        title={`${v.description} (Drag or click to insert)`}
                        className="group flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/70 dark:border-slate-700/70 hover:border-blue-300 dark:hover:border-blue-700 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer active:scale-95 shadow-2xs"
                      >
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          +{v.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {`{{${v.key}}}`}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Real-time Live Subject Preview */}
                  <div className="mt-3 p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 dark:from-slate-800/70 dark:via-slate-850 dark:to-slate-900 rounded-2xl border border-blue-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <Eye className="w-3 h-3" />
                        Live Subject Preview
                      </span>
                      <Badge variant="outline" className="text-[9px] px-2 py-0 border-blue-200 dark:border-slate-700 text-slate-500 font-semibold bg-white/50 dark:bg-slate-900/50">
                        Sample: example.com
                      </Badge>
                    </div>
                    <div className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                      {renderSubjectPreview(templateForm.subject)}
                    </div>
                  </div>
                </section>

                {/* Content Section */}
                <section className="space-y-8 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm">
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
                        ref={textareaRef}
                        value={templateForm.body_html}
                        onFocus={() => setActiveTarget('body')}
                        onChange={(e) => setTemplateForm({ ...templateForm, body_html: e.target.value })}
                        className="min-h-[500px] font-mono text-sm bg-slate-900 text-slate-300 dark:bg-slate-950/50 dark:text-slate-300 rounded-3xl p-6 border-none focus:ring-0 leading-relaxed resize-y"
                        style={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}
                        placeholder="<html>&#10;  <body>&#10;    <h1>Hello {{customer_name}}!</h1>&#10;    <p>Domain: {{domain_name}}</p>&#10;  </body>&#10;</html>"
                      />
                      <div className="absolute top-4 right-6">
                        <Badge variant="outline" className="bg-white/10 text-white/50 border-white/10 text-[9px] font-black uppercase tracking-widest backdrop-blur-md">
                          Handlebars Supported
                        </Badge>
                      </div>
                    </div>

                    {/* Template Variables Palette */}
                    <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-2">
                            <MousePointerClick className="w-3.5 h-3.5" />
                            Insert Variables
                          </h4>
                          <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl p-0.5 border border-blue-200 dark:border-blue-800 text-[10px] font-bold shadow-2xs">
                            <span className="text-slate-400 px-2 uppercase tracking-wider text-[9px]">Target:</span>
                            <button
                              type="button"
                              onClick={() => setActiveTarget('subject')}
                              className={cn(
                                "px-2.5 py-1 rounded-lg transition-all uppercase tracking-wider text-[9px]",
                                activeTarget === 'subject'
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "text-slate-600 dark:text-slate-300 hover:text-blue-600"
                              )}
                            >
                              Subject Line
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTarget('body')}
                              className={cn(
                                "px-2.5 py-1 rounded-lg transition-all uppercase tracking-wider text-[9px]",
                                activeTarget === 'body'
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "text-slate-600 dark:text-slate-300 hover:text-blue-600"
                              )}
                            >
                              HTML Body
                            </button>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyAllVariables}
                          className="h-8 px-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-[9px] font-bold uppercase tracking-wider self-start sm:self-auto"
                        >
                          <Copy className="w-3 h-3 mr-1.5" />
                          Copy All for AI
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_VARIABLES.map(v => (
                          <div key={v.key} className="inline-flex rounded-lg shadow-2xs">
                            <button
                              type="button"
                              draggable="true"
                              onDragStart={(e) => {
                                e.dataTransfer.setData("text/plain", `{{${v.key}}}`);
                              }}
                              onClick={() => insertVariable(v.key)}
                              title={`${v.label} - ${v.description}\nClick to insert into ${activeTarget === 'subject' ? 'Subject Line' : 'HTML Body'}. Drag to drop anywhere.`}
                              className="group flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-800 px-2.5 py-1.5 rounded-l-lg text-[10px] text-slate-600 dark:text-slate-400 font-bold font-mono hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300 transition-all cursor-grab active:cursor-grabbing active:scale-95"
                            >
                              <GripVertical className="w-2.5 h-2.5 opacity-30 group-hover:opacity-60" />
                              <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600">{v.label}</span>
                              <span className="text-[9px] opacity-70">{`{{${v.key}}}`}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => insertVariable(v.key, activeTarget === 'subject' ? 'body' : 'subject')}
                              title={`Direct insert into ${activeTarget === 'subject' ? 'HTML Body' : 'Subject Line'}`}
                              className="bg-blue-50/70 dark:bg-slate-800 border-y border-r border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-1.5 py-1.5 rounded-r-lg text-[9px] font-bold transition-all"
                            >
                              {activeTarget === 'subject' ? '→Body' : '→Subj'}
                            </button>
                          </div>
                        ))}
                      </div>

                      <p className="mt-3 text-[10px] text-slate-400 italic">
                        Click any variable to insert into the active target (<span className="font-bold text-blue-600 dark:text-blue-400">{activeTarget === 'subject' ? 'Subject Line' : 'HTML Content'}</span>). You can also drag-and-drop any variable directly into the input fields.
                      </p>
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
        <DialogContent className="max-w-5xl h-[85vh] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-950 flex flex-col [&>button]:hidden">
          {/* Email Client Header */}
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" />
                Email Preview
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPreviewDialog(false)} className="h-8 w-8 rounded-full p-0 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-4 h-4 text-slate-400" />
              </Button>
            </div>

            {/* Email Header Fields */}
            {previewData && (
              <div className="space-y-2.5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm border border-gray-100 dark:border-slate-800">
                <div className="flex items-center text-xs">
                  <span className="w-20 text-slate-400 font-semibold shrink-0">From:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {previewData.context?.company_name || 'Online Consultancy Services'} &lt;{previewData.context?.support_email || 'noreply@subsync.example.com'}&gt;
                  </span>
                </div>
                <div className="flex items-center text-xs">
                  <span className="w-20 text-slate-400 font-semibold shrink-0">To:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {previewData.context?.customer_name || 'John Doe'} &lt;{previewData.context?.customer_email || 'john@example.com'}&gt;
                  </span>
                </div>
                <div className="flex items-center text-xs">
                  <span className="w-20 text-slate-400 font-semibold shrink-0">Subject:</span>
                  <span className="text-slate-900 dark:text-white font-bold bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800/50 text-sm">
                    {previewData.subject || "(No Subject)"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Email Body Preview */}
          <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900/50 p-6">
            {previewLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p className="text-xs font-black uppercase tracking-widest">Rendering Preview...</p>
              </div>
            ) : previewData ? (
              <div className="max-w-3xl mx-auto">
                {/* Email Container */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                  {/* The actual email content */}
                  <div
                    dangerouslySetInnerHTML={{ __html: previewData.html }}
                    className="email-preview-content"
                    style={{ all: 'initial', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                  />
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest">
                  This is a preview. Actual emails may vary slightly depending on the email client.
                </p>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default EmailTemplates;
