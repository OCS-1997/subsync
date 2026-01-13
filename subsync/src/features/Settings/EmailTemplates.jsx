import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";
import {
  Loader2, Mail, Plus, Trash2, Save, X, Eye, Search,
  AlertCircle, CheckCircle, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.EMAIL_TEMPLATES_CREATE);
  const canUpdate = hasPermission(PERMISSIONS.EMAIL_TEMPLATES_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.EMAIL_TEMPLATES_DELETE);
  const canView = hasPermission(PERMISSIONS.EMAIL_TEMPLATES_VIEW);

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
    setTemplateForm({
      id: null,
      template_key: "",
      name: "",
      subject: "",
      body_html: "",
      active: true,
    });
    setShowTemplateDialog(true);
  };

  const handleEditTemplate = () => {
    setShowTemplateDialog(true);
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
        await api.post("/email-templates", templateForm);
        toast.success("Email template created successfully");
      }
      setShowTemplateDialog(false);
      await fetchData();
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
      if (selectedTemplateId === template.id) {
        setSelectedTemplateId(null);
        setTemplateForm({
          id: null,
          template_key: "",
          name: "",
          subject: "",
          body_html: "",
          active: true,
        });
      }
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete email template");
    }
  };

  const handlePreview = async () => {
    if (!templateForm.id) {
      toast.error("Please save the template first before previewing");
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

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-lg font-medium animate-pulse">Loading Email Templates...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Email Templates</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage email templates for subscription reminders
              </p>
            </div>
            {canCreate && (
              <Button onClick={handleNewTemplate} className="shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> New Template
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Template List */}
        <div className="w-80 border-r border-border bg-card/20 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence>
              {filteredTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => handleSelectTemplate(template)}
                  className={`
                    relative px-4 py-3 cursor-pointer border-l-2 transition-all
                    ${selectedTemplateId === template.id
                      ? 'bg-primary/5 border-l-blue-500'
                      : 'border-l-transparent hover:bg-accent/50'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold text-sm truncate ${selectedTemplateId === template.id ? 'text-primary' : 'text-foreground'}`}>
                          {template.name}
                        </h3>
                        {template.active ? (
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" title="Active" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-gray-400 flex-shrink-0" title="Inactive" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate">{template.template_key}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12 px-4 text-muted-foreground">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No templates found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Template Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedTemplate ? (
            <>
              <div className="border-b border-border bg-card/30 p-6">
                <div className="max-w-4xl">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold mb-1">Template Editor</h2>
                      <p className="text-sm text-muted-foreground">
                        Edit email template content and preview
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedTemplate.active ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-500/10 text-gray-600 dark:text-gray-400 text-xs font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Inactive
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="template-key" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Template Key *
                        </Label>
                        <Input
                          id="template-key"
                          value={templateForm.template_key}
                          onChange={(e) => setTemplateForm({ ...templateForm, template_key: e.target.value })}
                          placeholder="e.g. before_30"
                          className="h-9 font-mono"
                          disabled={!!templateForm.id || !canUpdate}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="template-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Template Name *
                        </Label>
                        <Input
                          id="template-name"
                          value={templateForm.name}
                          onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                          placeholder="e.g. 30 Days Before Expiry"
                          className="h-9"
                          disabled={!canUpdate}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template-subject" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Email Subject *
                      </Label>
                      <Input
                        id="template-subject"
                        value={templateForm.subject}
                        onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                        placeholder="e.g. Your subscription expires in 30 days"
                        className="h-9"
                        disabled={!canUpdate}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template-body" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Email Body (HTML) *
                      </Label>
                      <Textarea
                        id="template-body"
                        value={templateForm.body_html}
                        onChange={(e) => setTemplateForm({ ...templateForm, body_html: e.target.value })}
                        placeholder="Enter HTML content with Handlebars variables..."
                        className="min-h-[300px] font-mono text-sm"
                        disabled={!canUpdate}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use Handlebars syntax: {`{{customer_name}}`}, {`{{subscription_id}}`}, {`{{days_left}}`}, etc.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="template-active"
                        checked={templateForm.active}
                        onCheckedChange={(checked) => setTemplateForm({ ...templateForm, active: checked })}
                        disabled={!canUpdate}
                      />
                      <Label htmlFor="template-active" className="cursor-pointer">
                        Template is active
                      </Label>
                    </div>

                    {(canCreate || canUpdate) && (
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={handleEditTemplate}
                          disabled={saving}
                          size="sm"
                          className="shadow-sm"
                        >
                          {saving ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                          Save Template
                        </Button>
                        {templateForm.id && (
                          <Button
                            onClick={handlePreview}
                            disabled={previewLoading}
                            variant="outline"
                            size="sm"
                          >
                            {previewLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Eye className="w-3 h-3 mr-2" />}
                            Preview
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(selectedTemplate)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Delete
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Mail className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Select a template to edit</p>
                <p className="text-sm mt-1">or create a new template to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{templateForm.id ? "Edit Template" : "Create New Template"}</DialogTitle>
            <DialogDescription>
              {templateForm.id ? "Update email template" : "Create a new email template for reminders"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-template-key">Template Key *</Label>
                <Input
                  id="dialog-template-key"
                  value={templateForm.template_key}
                  onChange={(e) => setTemplateForm({ ...templateForm, template_key: e.target.value })}
                  placeholder="e.g. before_30"
                  className="font-mono"
                  disabled={!!templateForm.id}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-template-name">Template Name *</Label>
                <Input
                  id="dialog-template-name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g. 30 Days Before Expiry"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-template-subject">Email Subject *</Label>
              <Input
                id="dialog-template-subject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                placeholder="e.g. Your subscription expires in 30 days"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-template-body">Email Body (HTML) *</Label>
              <Textarea
                id="dialog-template-body"
                value={templateForm.body_html}
                onChange={(e) => setTemplateForm({ ...templateForm, body_html: e.target.value })}
                placeholder="Enter HTML content with Handlebars variables..."
                className="min-h-[400px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Available variables: {`{{customer_name}}`}, {`{{subscription_id}}`}, {`{{domain_name}}`}, {`{{days_left}}`}, {`{{end_date}}`}, {`{{total}}`}, {`{{items_table_html}}`}, {`{{renewal_link}}`}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="dialog-template-active"
                checked={templateForm.active}
                onCheckedChange={(checked) => setTemplateForm({ ...templateForm, active: checked })}
              />
              <Label htmlFor="dialog-template-active" className="cursor-pointer">
                Template is active
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {templateForm.id ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview of how the email will look with sample data
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Subject:</Label>
                <div className="p-3 bg-muted rounded-md font-medium">{previewData.subject}</div>
              </div>
              <div className="space-y-2">
                <Label>Body:</Label>
                <div
                  className="p-4 bg-muted rounded-md border"
                  dangerouslySetInnerHTML={{ __html: previewData.html }}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-lg shadow-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Delete Template</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>? This action cannot be undone.
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(null)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTemplate(showDeleteConfirm)}
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Delete Template
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmailTemplates;

