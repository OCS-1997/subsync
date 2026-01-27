import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, FolderKanban, Check, ChevronsUpDown, Search, User, Clock, Briefcase } from 'lucide-react';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import GenericTable from '@/components/layouts/GenericTable';
import Pagination from '@/components/layouts/Pagination';

const ProjectManagement = ({ customers = [] }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [deleteConfirmationName, setDeleteConfirmationName] = useState('');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        project_name: '',
        project_code: '',
        customer_id: '',
        description: '',
        color: '#3b82f6',
        estimated_hours: '',
        is_active: true
    });

    useEffect(() => {
        fetchProjects();
    }, [currentPage, pageSize]);

    const fetchProjects = async (resetPage = false) => {
        setLoading(true);
        try {
            const pageToFetch = resetPage ? 1 : currentPage;
            if (resetPage) setCurrentPage(1);

            const response = await api.get('/time-tracking/projects', {
                params: {
                    page: pageToFetch,
                    limit: pageSize,
                    search: searchQuery
                }
            });
            setProjects(response.data.projects || []);
            setTotalPages(response.data.totalPages || 1);
            setTotalRecords(response.data.totalRecords || 0);
        } catch (error) {
            console.error('Error fetching projects:', error);
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProject) {
                await api.put(`/time-tracking/projects/${editingProject.id}`, formData);
                toast.success('Project updated successfully');
            } else {
                await api.post('/time-tracking/projects', formData);
                toast.success('Project created successfully');
            }
            setDialogOpen(false);
            resetForm();
            fetchProjects();
        } catch (error) {
            console.error('Error saving project:', error);
            toast.error('Failed to save project');
        }
    };

    const handleDeleteClick = (project) => {
        setProjectToDelete(project);
        setDeleteConfirmationName('');
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!projectToDelete) return;
        if (deleteConfirmationName !== projectToDelete.project_name) {
            toast.error('Project name does not match');
            return;
        }

        try {
            await api.delete(`/time-tracking/projects/${projectToDelete.id}`);
            toast.success('Project deleted successfully');
            setDeleteDialogOpen(false);
            setProjectToDelete(null);
            setDeleteConfirmationName('');
            fetchProjects();
        } catch (error) {
            console.error('Error deleting project:', error);
            toast.error('Failed to delete project');
        }
    };

    const handleEdit = (project) => {
        setEditingProject(project);
        setFormData({
            project_name: project.project_name,
            project_code: project.project_code || '',
            customer_id: project.customer_id || '',
            description: project.description || '',
            color: project.color || '#3b82f6',
            estimated_hours: project.estimated_hours || '',
            is_active: project.is_active
        });
        setDialogOpen(true);
    };

    const resetForm = () => {
        setEditingProject(null);
        setFormData({
            project_name: '',
            project_code: '',
            customer_id: '',
            description: '',
            color: '#3b82f6',
            estimated_hours: '',
            is_active: true
        });
    };

    const headers = [
        { key: 'project_info', label: 'Project Name' },
        { key: 'customer_info', label: 'Customer' },
        { key: 'project_code_info', label: 'Code' },
        { key: 'time_info', label: 'Time Tracked' },
        { key: 'status_info', label: 'Status' },
        { key: 'actions', label: 'Actions', align: 'center' }
    ];

    const tableData = projects.map(project => ({
        id: project.id,
        project_info: (
            <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ backgroundColor: project.color }}></div>
                <div className="flex flex-col">
                    <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight">{project.project_name}</span>
                    {project.description && <span className="text-[10px] font-bold text-slate-400 truncate max-w-[200px]">{project.description}</span>}
                </div>
            </div>
        ),
        customer_info: (
            <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gray-50 dark:bg-slate-950 flex items-center justify-center border border-gray-100 dark:border-slate-800">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {project.customer_name || 'Unassigned'}
                </span>
            </div>
        ),
        project_code_info: project.project_code ? (
            <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-none px-3 py-1 font-mono text-[9px] font-black uppercase tracking-widest shadow-sm">
                {project.project_code}
            </Badge>
        ) : (
            <span className="text-xs font-medium text-slate-400 italic">No code</span>
        ),
        time_info: (
            <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                        {project.total_minutes ? 
                            `${Math.floor(project.total_minutes / 60)}h ${project.total_minutes % 60}m` : 
                            '0h 00m'
                        }
                    </span>
                    {project.estimated_hours && (
                        <span className="text-xs font-medium text-slate-500">
                            Target: {project.estimated_hours}h
                        </span>
                    )}
                </div>
            </div>
        ),
        status_info: project.is_active ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active</span>
            </div>
        ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-slate-800 rounded-full w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                <span className="text-xs font-medium text-gray-500">Inactive</span>
            </div>
        ),
        actions: (
            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEdit(project)}
                    className="h-9 w-9 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-950 border-gray-100 dark:border-slate-800 shadow-sm"
                >
                    <Pencil className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteClick(project)}
                    className="h-9 w-9 p-0 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 border-gray-100 dark:border-slate-800 hover:border-red-100 transition-all shadow-sm"
                >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
            </div>
        )
    }));

    return (
        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm transition-all duration-300">
            <CardHeader className="bg-white dark:bg-slate-800/20 border-b border-gray-50 dark:border-slate-800 p-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FolderKanban className="w-5 h-5" />
                            Project Management
                        </CardTitle>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your time tracking projects</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchProjects(true)}
                                className="h-10 pl-10 rounded-xl bg-gray-50 dark:bg-slate-950 border-transparent focus:bg-white transition-all shadow-none"
                            />
                        </div>
                        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                            <DialogTrigger asChild>
                                <Button className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm shadow-sm transition-colors">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Project
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl dark:bg-slate-900 dark:border-slate-800 rounded-[2rem]">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                                        {editingProject ? 'Edit Project' : 'Create New Project'}
                                    </DialogTitle>
                                    <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                                        {editingProject ? 'Update project details' : 'Add a new project for time tracking'}
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Project Name <span className="text-red-500">*</span></Label>
                                            <Input
                                                value={formData.project_name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                                                required
                                                className="h-11 rounded-xl font-bold bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Project Code</Label>
                                            <Input
                                                value={formData.project_code}
                                                onChange={(e) => setFormData(prev => ({ ...prev, project_code: e.target.value }))}
                                                placeholder="e.g., OCS-25-A"
                                                className="h-11 rounded-xl font-bold bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Customer {customers.length > 0 && <span className="text-slate-400">({customers.length} available)</span>}
                                            </Label>
                                            <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="h-11 w-full justify-between items-center px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-900 transition-all shadow-sm"
                                                    >
                                                        <span className="truncate">
                                                            {formData.customer_id
                                                                ? customers.find((c) => c.customer_id === formData.customer_id)?.display_name
                                                                : "Select customer..."}
                                                        </span>
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[400px] max-w-[90vw] p-0 dark:bg-slate-900 dark:border-slate-800 rounded-xl" align="start">
                                                    <Command className="dark:bg-slate-900" shouldFilter={true}>
                                                        <CommandInput placeholder="Search customers..." className="h-9 border-none" />
                                                        <CommandList className="max-h-[300px] overflow-y-auto">
                                                            <CommandEmpty className="py-6 text-center text-sm text-slate-500">No customers found.</CommandEmpty>
                                                            <CommandGroup className="p-2">
                                                                {customers.map((c) => (
                                                                    <CommandItem
                                                                        key={c.customer_id}
                                                                        value={`${c.display_name} ${c.customer_id} ${c.email || ''}`}
                                                                        keywords={[c.display_name, c.customer_id, c.email || '', c.company_name || '']}
                                                                        onSelect={() => {
                                                                            setFormData(prev => ({ ...prev, customer_id: c.customer_id }));
                                                                            setCustomerPopoverOpen(false);
                                                                        }}
                                                                        className="rounded-lg mb-1 data-[selected=true]:bg-blue-600 data-[selected=true]:text-white cursor-pointer"
                                                                    >
                                                                        <Check className={cn("mr-2 h-4 w-4", formData.customer_id === c.customer_id ? "opacity-100" : "opacity-0")} />
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold text-sm tracking-tight">{c.display_name}</span>
                                                                            {c.email && <span className="text-xs text-slate-400">{c.email}</span>}
                                                                        </div>
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estimated Hours</Label>
                                            <div className="relative group">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                <Input
                                                    type="number"
                                                    value={formData.estimated_hours}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: e.target.value }))}
                                                    placeholder="Target hrs"
                                                    className="h-11 pl-10 rounded-xl font-bold bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            rows={3}
                                            className="rounded-xl font-bold bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 shadow-sm"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Project Color</Label>
                                        <div className="space-y-3">
                                            <div className="flex gap-3">
                                                <div className="flex gap-2 items-center flex-1 h-11 px-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 group focus-within:ring-2 ring-blue-500/10">
                                                    <input
                                                        type="color"
                                                        value={formData.color}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                                        className="w-12 h-6 rounded border-none bg-transparent cursor-pointer"
                                                    />
                                                    <span className="text-xs font-mono font-bold text-slate-400 uppercase">{formData.color}</span>
                                                </div>
                                                <Input
                                                    value={formData.color}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                                    placeholder="#3b82f6"
                                                    className="h-11 w-32 rounded-xl font-mono font-bold text-sm bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 shadow-sm uppercase"
                                                />
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#14b8a6', '#06b6d4', '#6366f1', '#a855f7'].map(color => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                                                        className={cn(
                                                            "w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110",
                                                            formData.color === color ? "border-white dark:border-slate-900 ring-2 ring-offset-2 ring-blue-500 scale-110" : "border-transparent"
                                                        )}
                                                        style={{ backgroundColor: color }}
                                                        title={color}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <DialogFooter className="pt-4">
                                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="h-10 px-4 rounded-lg">
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">
                                            {editingProject ? 'Update Project' : 'Create Project'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium text-slate-500">Loading projects...</span>
                    </div>
                ) : (
                    <>
                        <GenericTable 
                            headers={headers} 
                            data={tableData} 
                            primaryKey="id" 
                        />
                        <Pagination 
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            totalPages={totalPages}
                            totalRecords={totalRecords}
                        />
                    </>
                )}
            </CardContent>

            {/* Delete Confirmation AlertDialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black text-red-600 dark:text-red-500 flex items-center gap-2">
                            <Trash2 className="w-5 h-5" />
                            Confirm Project Deletion
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-slate-600 dark:text-slate-400 pt-2">
                            This action cannot be undone. This will permanently delete the project
                            {projectToDelete && (
                                <span className="font-black text-slate-900 dark:text-white"> "{projectToDelete.project_name}"</span>
                            )} and all associated time tracking data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-4">
                            <p className="text-xs font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-2">
                                ⚠️ Security Verification Required
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                                Please type <span className="font-black bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded">{projectToDelete?.project_name}</span> to confirm deletion.
                            </p>
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">
                                Confirm Project Name
                            </Label>
                            <Input
                                value={deleteConfirmationName}
                                onChange={(e) => setDeleteConfirmationName(e.target.value)}
                                placeholder="Type project name here..."
                                className="h-11 rounded-xl font-bold bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 shadow-sm"
                                autoFocus
                            />
                        </div>
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel 
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setProjectToDelete(null);
                                setDeleteConfirmationName('');
                            }}
                            className="h-11 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <Button
                            onClick={handleDeleteConfirm}
                            disabled={deleteConfirmationName !== projectToDelete?.project_name}
                            className="h-11 px-8 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Delete Permanently
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
};

export default ProjectManagement;

