import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '@/lib/axiosInstance.js';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { Plus, Loader2, Search, ExternalLink, Settings, AlertCircle, CheckCircle2, XCircle, Globe, Layout, ShieldCheck, ChevronRight, Gavel, MousePointer2 } from 'lucide-react';
import ToolCard from '../components/ToolCard.jsx';
import { usePermissions } from '@/context/PermissionsContext.jsx';
import { PERMISSIONS } from '@/constants/permissions.js';
import { PageHeader } from '@/components/ui/breadcrumb.jsx';
import { cn } from "@/lib/utils";
import Hamster from '@/components/animations/Hamster.jsx';

const VALID_ROLES = ['admin', 'manager', 'sales', 'support', 'viewer'];

const ICON_SUGGESTIONS = [
  { icon: 'fa-globe', label: 'Globe' },
  { icon: 'fa-search', label: 'Search' },
  { icon: 'fa-lock', label: 'Lock' },
  { icon: 'fa-shield', label: 'Shield' },
  { icon: 'fa-chart-line', label: 'Chart' },
  { icon: 'fa-network-wired', label: 'Network' },
  { icon: 'fa-server', label: 'Server' },
  { icon: 'fa-database', label: 'Database' },
  { icon: 'fa-code', label: 'Code' },
  { icon: 'fa-bug', label: 'Bug' },
  { icon: 'fa-key', label: 'Key' },
  { icon: 'fa-cloud', label: 'Cloud' },
];

function QuickToolsAdmin() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    url_template: '',
    icon: 'fa-globe',
    roles_allowed: [],
    is_active: true,
    sort_order: 0,
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [testDomain, setTestDomain] = useState('example.com');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toolToDelete, setToolToDelete] = useState(null);

  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS.QUICK_TOOLS_MANAGE);

  useEffect(() => {
    if (canManage) {
      fetchTools();
    }
  }, [canManage]);

  useEffect(() => {
    if (formData.url_template && testDomain) {
      updatePreview();
    }
  }, [formData.url_template, testDomain]);

  const fetchTools = async () => {
    try {
      setLoading(true);
      const response = await api.get('/quick-tools/all');
      setTools(response.data || []);
    } catch (error) {
      console.error('Error fetching tools:', error);
      toast.error('Failed to load quick tools');
    } finally {
      setLoading(false);
    }
  };

  const updatePreview = async () => {
    if (!formData.url_template.includes('{{domain}}')) {
      setPreviewUrl('');
      return;
    }
    try {
      const response = await api.post('/quick-tools/preview', {
        url_template: formData.url_template,
        test_domain: testDomain,
      });
      setPreviewUrl(response.data.preview_url);
    } catch (error) {
      setPreviewUrl('');
    }
  };

  const handleNewTool = () => {
    setEditingTool(null);
    setFormData({
      name: '',
      url_template: '',
      icon: 'fa-globe',
      roles_allowed: [],
      is_active: true,
      sort_order: 0,
    });
    setTestDomain('example.com');
    setPreviewUrl('');
    setShowDialog(true);
  };

  const handleEdit = (tool) => {
    setEditingTool(tool);
    setFormData({
      name: tool.name,
      url_template: tool.url_template,
      icon: tool.icon,
      roles_allowed: Array.isArray(tool.roles_allowed)
        ? tool.roles_allowed
        : JSON.parse(tool.roles_allowed || '[]'),
      is_active: tool.is_active,
      sort_order: tool.sort_order,
    });
    setTestDomain('example.com');
    setShowDialog(true);
  };

  const handleDelete = (tool) => {
    setToolToDelete(tool);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!toolToDelete) return;

    try {
      await api.delete(`/quick-tools/${toolToDelete.tool_id}`);
      toast.success('Tool deleted successfully');
      setDeleteDialogOpen(false);
      setToolToDelete(null);
      fetchTools();
    } catch (error) {
      console.error('Error deleting tool:', error);
      toast.error(error.response?.data?.error || 'Failed to delete tool');
    }
  };

  const handleToggleActive = async (tool) => {
    try {
      await api.put(`/quick-tools/${tool.tool_id}`, {
        ...tool,
        is_active: !tool.is_active,
      });
      toast.success(`Tool ${tool.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchTools();
    } catch (error) {
      console.error('Error toggling tool:', error);
      toast.error('Failed to update tool');
    }
  };

  const handleRoleToggle = (role) => {
    setFormData((prev) => ({
      ...prev,
      roles_allowed: prev.roles_allowed.includes(role)
        ? prev.roles_allowed.filter((r) => r !== role)
        : [...prev.roles_allowed, role],
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Tool name is required');
      return;
    }
    if (!formData.url_template.trim()) {
      toast.error('URL template is required');
      return;
    }
    if (!formData.url_template.includes('{{domain}}')) {
      toast.error('URL template must include {{domain}} placeholder');
      return;
    }
    if (formData.roles_allowed.length === 0) {
      toast.error('At least one role must be selected');
      return;
    }

    setSaving(true);
    try {
      if (editingTool) {
        await api.put(`/quick-tools/${editingTool.tool_id}`, formData);
        toast.success('Tool updated successfully');
      } else {
        await api.post('/quick-tools', formData);
        toast.success('Tool created successfully');
      }
      setShowDialog(false);
      fetchTools();
    } catch (error) {
      console.error('Error saving tool:', error);
      toast.error(error.response?.data?.error || 'Failed to save tool');
    } finally {
      setSaving(false);
    }
  };

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.url_template.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!canManage) {
    return (
      <div className="min-h-screen bg-slate-50/30 dark:bg-transparent p-6 flex items-center justify-center">
        <Card className="max-w-md rounded-[2.5rem] border-none shadow-2xl shadow-red-200/50 dark:shadow-none bg-white dark:bg-slate-900/50 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02]">
          <CardContent className="p-12 text-center space-y-6">
            <div className="mx-auto w-24 h-24 rounded-3xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center animate-pulse">
              <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Access Denied</h3>
            <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">You don't have permission to manage quick tools.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/30 dark:bg-transparent px-4 sm:px-8 py-8 transition-colors duration-500">
      <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Modern Header */}
        <PageHeader
          title="Quick Tools"
          description="Manage diagnostic tools for domain analysis"
          actions={
            <Button
              onClick={handleNewTool}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-500/10 rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Tool
            </Button>
          }
        />

        {/* Dynamic Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900/50 backdrop-blur-xl group hover:scale-[1.02] transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Total Tools</p>
                  <p className="text-4xl font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{tools.length}</p>
                </div>
                <div className="p-4 rounded-[1.5rem] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  <Settings className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900/50 backdrop-blur-xl group hover:scale-[1.02] transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Active</p>
                  <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{tools.filter(t => t.is_active).length}</p>
                </div>
                <div className="p-4 rounded-[1.5rem] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900/50 backdrop-blur-xl group hover:scale-[1.02] transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Inactive</p>
                  <p className="text-4xl font-black text-slate-400 dark:text-slate-500">{tools.filter(t => !t.is_active).length}</p>
                </div>
                <div className="p-4 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-slate-400 group-hover:text-white transition-all duration-300 shadow-sm">
                  <XCircle className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tools Explorer Bar */}
        <div className="flex flex-col lg:flex-row gap-6 items-center px-1">
          <div className="flex flex-1 gap-6 w-full items-center">
            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl h-14 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all px-5">
              <Search className="text-slate-400 h-5 w-5 mr-3" />
              <Input
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-none bg-transparent shadow-none focus-visible:ring-0 text-base p-0 w-full"
              />
            </div>
            {searchTerm && (
              <Button
                variant="ghost"
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest"
              >
                Clear Search
              </Button>
            )}
          </div>
        </div>

        {/* Tools Content Area */}
        <div className="relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <Hamster />
              <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Loading tools...</p>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/50 rounded-[3rem] p-24 text-center border-none shadow-xl">
              <div className="mx-auto w-32 h-32 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-8">
                <Settings className="h-16 w-16 text-slate-200 dark:text-slate-700" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-4 tracking-tight">
                {searchTerm ? 'No tools found' : 'No tools configured'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-10 text-lg">
                {searchTerm ? 'Try adjusting your search filters to find what you are looking for' : 'Get started by creating your first diagnostic tool for the pipeline'}
              </p>
              {!searchTerm && (
                <Button onClick={handleNewTool} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95">
                  <Plus className="h-5 w-5 mr-2" />
                  Create First Tool
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {filteredTools.map((tool, idx) => (
                <div key={tool.tool_id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                  <ToolCard
                    tool={tool}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modernized Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 backdrop-blur-2xl max-w-2xl max-h-[90vh] overflow-y-auto p-0 border border-slate-100 dark:border-slate-800">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 dark:from-blue-600/10 dark:to-indigo-600/10 border-b border-slate-100 dark:border-slate-800/50 p-10">
              <div className="flex items-center gap-6">
                <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-500/30">
                  <Layout className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {editingTool ? 'Edit Tool' : 'Create New Tool'}
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Configure a diagnostic tool with URL template. Use {'{{domain}}'} as placeholder.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              {/* Basic Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-5 bg-blue-600 rounded-full" />
                  <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">Basic Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-500">Tool Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., DNS Checker"
                      className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all text-base font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon" className="text-xs font-black uppercase tracking-widest text-slate-500">Icon CSS</Label>
                    <div className="flex gap-3">
                      <Input
                        id="icon"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        placeholder="fa-globe"
                        className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all text-base font-mono"
                      />
                      <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm">
                        <i className={`fas ${formData.icon} text-xl text-blue-600 dark:text-blue-400`}></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Icon Suggestions</Label>
                  <div className="flex flex-wrap gap-4">
                    {ICON_SUGGESTIONS.map(({ icon, label }) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                          formData.icon === icon
                            ? "bg-blue-600 text-white shadow-xl shadow-blue-500/40 scale-110"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        )}
                        title={label}
                      >
                        <i className={`fas ${icon} text-lg`}></i>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url_template" className="text-xs font-black uppercase tracking-widest text-slate-500">URL Template <span className="text-red-500">*</span></Label>
                  <div className="relative group">
                    <Input
                      id="url_template"
                      value={formData.url_template}
                      onChange={(e) => setFormData({ ...formData, url_template: e.target.value })}
                      placeholder="https://example.com/check/{{domain}}"
                      className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all text-base font-mono"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-500 bg-blue-50 dark:bg-blue-900/50 px-2 py-1 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity">
                      REQUIRED: {'{{domain}}'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-6 pt-10 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-5 bg-purple-600 rounded-full" />
                  <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">Access Permissions</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {VALID_ROLES.map((role) => (
                    <div
                      key={role}
                      onClick={() => handleRoleToggle(role)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                        formData.roles_allowed.includes(role)
                          ? "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30 scale-[1.02]"
                          : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-purple-200"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-bold capitalize transition-colors",
                        formData.roles_allowed.includes(role) ? "text-purple-700 dark:text-purple-400" : "text-slate-600 dark:text-slate-400"
                      )}>{role}</span>
                      <Checkbox
                        id={`role-${role}`}
                        checked={formData.roles_allowed.includes(role)}
                        onCheckedChange={() => { }}
                        className="data-[state=checked]:bg-purple-600 h-5 w-5 rounded-lg border-none bg-slate-100 dark:bg-slate-700"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="space-y-6 pt-10 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-5 bg-emerald-600 rounded-full" />
                  <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">Configuration</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="sort_order" className="text-xs font-black uppercase tracking-widest text-slate-500">Sort Priority</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none focus-visible:ring-2 focus-visible:ring-emerald-500 font-bold"
                    />
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={cn(
                      "flex items-center justify-between p-6 mt-4 rounded-3xl border transition-all cursor-pointer",
                      formData.is_active
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30"
                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"
                    )}
                  >
                    <div className="flex gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm transition-colors",
                        formData.is_active ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800"
                      )}>
                        {formData.is_active ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <XCircle className="h-6 w-6 text-slate-400" />}
                      </div>
                      <div>
                        <Label className="text-base font-black">Active</Label>
                        <p className="text-xs text-slate-500">Live for all users</p>
                      </div>
                    </div>
                    <Checkbox
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={() => { }}
                      className="h-7 w-7 rounded-lg data-[state=checked]:bg-emerald-600 border-none bg-slate-100 dark:bg-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Interactive Preview Section */}
              <div className="space-y-6 pt-10 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-5 bg-amber-600 rounded-full" />
                  <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">URL Validation</h3>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] p-8 space-y-6 border border-slate-50 dark:border-slate-800/50">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Test Domain Context</Label>
                    <div className="flex gap-4">
                      <Input
                        id="test_domain"
                        value={testDomain}
                        onChange={(e) => setTestDomain(e.target.value)}
                        placeholder="example.com"
                        className="h-14 rounded-2xl bg-white dark:bg-slate-900 border-none focus-visible:ring-2 focus-visible:ring-amber-500 font-bold shadow-sm"
                      />
                      {previewUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
                          className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-amber-600 border-none shadow-sm"
                        >
                          <ExternalLink className="h-6 w-6" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {previewUrl ? (
                    <div className="p-6 rounded-3xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 animate-in zoom-in-95 duration-500">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Preview URL Generated
                        </p>
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      </div>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300 break-all font-mono leading-relaxed bg-white dark:bg-slate-900/50 p-4 rounded-2xl">
                        {previewUrl}
                      </p>
                    </div>
                  ) : formData.url_template && !formData.url_template.includes('{{domain}}') ? (
                    <div className="p-6 rounded-3xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 animate-in shake duration-500">
                      <p className="text-sm font-black text-red-700 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        URL template must include {'{{domain}}'}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
            <DialogFooter className="p-10 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 gap-4 flex-col sm:flex-row">
              <Button
                variant="ghost"
                onClick={() => setShowDialog(false)}
                className="h-14 rounded-2xl px-8 font-black uppercase tracking-widest text-[10px] text-slate-500"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="h-14 rounded-2xl px-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.05] active:scale-95"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {editingTool ? 'Update Tool' : 'Create Tool'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Premium Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 max-w-lg p-0 overflow-hidden">
          <div className="bg-red-600 p-12 text-center text-white space-y-4">
            <div className="mx-auto w-20 h-20 rounded-[2rem] bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
              <XCircle className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-3xl font-black tracking-tight">Delete Quick Tool</DialogTitle>
          </div>
          <div className="p-12 text-center space-y-10">
            <DialogDescription className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              Are you sure you want to delete <span className="font-black text-slate-900 dark:text-white underline decoration-red-500/50 underline-offset-4">"{toolToDelete?.name}"</span>? This action cannot be undone.
            </DialogDescription>
            <div className="flex gap-4">
              <Button
                variant="ghost"
                onClick={() => setDeleteDialogOpen(false)}
                className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="flex-1 h-14 rounded-2xl bg-red-600 hover:bg-red-700 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-500/20"
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default QuickToolsAdmin;
