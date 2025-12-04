import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '@/lib/axiosInstance.js';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { Plus, Loader2, Search, ExternalLink, Settings, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import ToolCard from '../components/ToolCard.jsx';
import { usePermissions } from '@/context/PermissionsContext.jsx';
import { PERMISSIONS } from '@/constants/permissions.js';

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <Card className="max-w-md border-red-200 dark:border-red-800">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Access Denied</h3>
            <p className="text-gray-600 dark:text-gray-400">You don't have permission to manage quick tools.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Quick Tools</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage diagnostic tools for domain analysis
            </p>
          </div>
          <Button
            onClick={handleNewTool}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Tool
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tools</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{tools.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {tools.filter(t => t.is_active).length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive</p>
                  <p className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-1">
                    {tools.filter(t => !t.is_active).length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <XCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tools List */}
        <Card>
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <CardTitle>All Tools</CardTitle>
                <CardDescription>Manage your diagnostic tools</CardDescription>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                <p className="text-gray-500 dark:text-gray-400">Loading tools...</p>
              </div>
            ) : filteredTools.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="mx-auto w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                  <Settings className="h-10 w-10 text-blue-300 dark:text-blue-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {searchTerm ? 'No tools found' : 'No tools configured'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {searchTerm ? 'Try adjusting your search' : 'Get started by creating your first tool'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={handleNewTool} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Tool
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTools.map((tool) => (
                  <ToolCard
                    key={tool.tool_id}
                    tool={tool}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingTool ? 'Edit Tool' : 'Create New Tool'}
            </DialogTitle>
            <DialogDescription>
              Configure a diagnostic tool with URL template. Use {'{{domain}}'} as placeholder.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tool Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., DNS Checker"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">Icon <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="fa-globe"
                      className="flex-1"
                    />
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                      <i className={`fas ${formData.icon} text-lg text-blue-600 dark:text-blue-400`}></i>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Icon Suggestions</Label>
                <div className="flex flex-wrap gap-2">
                  {ICON_SUGGESTIONS.map(({ icon, label }) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${formData.icon === icon
                        ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                        }`}
                      title={label}
                    >
                      <i className={`fas ${icon}`}></i>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url_template">URL Template <span className="text-red-500">*</span></Label>
                <Input
                  id="url_template"
                  value={formData.url_template}
                  onChange={(e) => setFormData({ ...formData, url_template: e.target.value })}
                  placeholder="https://example.com/check/{{domain}}"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Must include {'{{domain}}'} placeholder
                </p>
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Permissions</h3>
              <div>
                <Label>Roles Allowed <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {VALID_ROLES.map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role}`}
                        checked={formData.roles_allowed.includes(role)}
                        onCheckedChange={() => handleRoleToggle(role)}
                      />
                      <label
                        htmlFor={`role-${role}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                      >
                        {role}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <label
                    htmlFor="is_active"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Active
                  </label>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Preview URL
              </h3>
              <div className="flex gap-2">
                <Input
                  id="test_domain"
                  value={testDomain}
                  onChange={(e) => setTestDomain(e.target.value)}
                  placeholder="example.com"
                  className="flex-1"
                />
                {previewUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
                    title="Open preview URL"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {previewUrl ? (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Preview URL Generated
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 break-all font-mono">{previewUrl}</p>
                </div>
              ) : formData.url_template && !formData.url_template.includes('{{domain}}') ? (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    URL template must include {'{{domain}}'}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingTool ? 'Update Tool' : 'Create Tool'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quick Tool</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{toolToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default QuickToolsAdmin;
