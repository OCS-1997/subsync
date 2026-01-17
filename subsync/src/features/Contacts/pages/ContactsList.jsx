import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Lock, MoreVertical, FileDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb.jsx';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import Hamster from '@/components/animations/Hamster.jsx';
import GenericTable from '@/components/layouts/GenericTable.jsx';
import Pagination from '@/components/layouts/Pagination.jsx';
import SearchFilterForm from '@/components/layouts/SearchFilterForm.jsx';
import { PageHeader } from '@/components/ui/breadcrumb.jsx';
import { fetchContacts, deleteContact, clearError } from '../contactsSlice';
import { usePermissions } from '@/context/PermissionsContext.jsx';
import { PERMISSIONS } from '@/constants/permissions.js';

const headers = [
    { key: 'full_name', label: 'Name' },
    { key: 'company_name', label: 'Company' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'domain', label: 'Domain' },
    { key: 'actions', label: 'Actions' },
];

export default function ContactsList() {
    const navigate = useNavigate();
    const { username } = useParams();
    const dispatch = useDispatch();
    const { hasPermission } = usePermissions();
    const { contacts, loading, error, totalPages, totalRecords } = useSelector((state) => state.contacts);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState(null);
    const [sortOrder, setSortOrder] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState(null);

    // Export state
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState('csv');
    const [exportFields, setExportFields] = useState({
        name: true,
        company: true,
        email: true,
        phone: true,
        domain: true,
        designation: true
    });

    const debounceTimeout = useRef();

    // Debounce search
    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(debounceTimeout.current);
    }, [search]);

    // Reset page on search/sort change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, sortBy, sortOrder]);

    // Fetch contacts
    useEffect(() => {
        const params = {
            search: debouncedSearch,
            page: currentPage,
            limit: 20,
        };
        if (sortBy && sortOrder) {
            params.sort = sortBy;
            params.order = sortOrder;
        }
        dispatch(fetchContacts(params));
    }, [dispatch, debouncedSearch, sortBy, sortOrder, currentPage]);

    // Handle errors
    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearError());
        }
    }, [error, dispatch]);

    const handleSearch = (e) => {
        if (e.key === 'Enter') setCurrentPage(1);
    };

    const handleSort = (key) => {
        if (key === 'actions') return;
        if (sortBy === key && sortOrder === 'asc') {
            setSortOrder('desc');
        } else if (sortBy === key && sortOrder === 'desc') {
            setSortBy(null);
            setSortOrder(null);
        } else {
            setSortBy(key);
            setSortOrder('asc');
        }
    };

    const handleDelete = async () => {
        if (!contactToDelete) return;

        try {
            await dispatch(deleteContact(contactToDelete.contact_id)).unwrap();
            toast.success('Contact deleted successfully!');
            setDeleteDialogOpen(false);
            setContactToDelete(null);
            // Refresh the list
            dispatch(fetchContacts({ page: currentPage, limit: 20, search: debouncedSearch }));
        } catch (err) {
            toast.error(err || 'Failed to delete contact');
        }
    };

    const openDeleteDialog = (contact) => {
        setContactToDelete(contact);
        setDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setContactToDelete(null);
    };

    const handleExport = () => {
        const dataToExport = contacts.map(contact => {
            const exportRow = {};
            if (exportFields.name) {
                exportRow['Name'] = `${contact.salutation || ''} ${contact.first_name || ''} ${contact.last_name || ''}`.trim();
            }
            if (exportFields.designation) {
                exportRow['Designation'] = contact.designation || '-';
            }
            if (exportFields.company) {
                exportRow['Company'] = contact.company_name || '-';
            }
            if (exportFields.email) {
                exportRow['Email'] = contact.email || '-';
            }
            if (exportFields.phone) {
                exportRow['Phone'] = contact.country_code && contact.phone_number
                    ? `${contact.country_code} ${contact.phone_number}`
                    : '-';
            }
            if (exportFields.domain) {
                exportRow['Domain'] = contact.domain_name || contact.domain_free_text || '-';
            }
            return exportRow;
        });

        if (dataToExport.length === 0) {
            toast.warning('No data available to export');
            return;
        }

        if (exportFormat === 'csv') {
            exportToCSV(dataToExport);
        } else {
            exportToText(dataToExport);
        }

        setExportDialogOpen(false);
        toast.success(`Contacts exported successfully as ${exportFormat.toUpperCase()}`);
    };

    const exportToCSV = (data) => {
        const headers = Object.keys(data[0] || {});
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Contacts_Export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const exportToText = (data) => {
        let content = 'CONTACTS - EXPORT REPORT\n';
        content += '='.repeat(80) + '\n\n';
        content += `Generated on: ${new Date().toLocaleString('en-IN')}\n`;
        content += `Total Records: ${data.length}\n\n`;
        content += '='.repeat(80) + '\n\n';

        data.forEach((contact, index) => {
            content += `CONTACT #${index + 1}\n`;
            content += '-'.repeat(80) + '\n';
            Object.entries(contact).forEach(([key, value]) => {
                content += `${key.padEnd(20)}: ${value}\n`;
            });
            content += '\n';
        });

        content += '='.repeat(80) + '\n';
        content += 'END OF REPORT\n';

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Contacts_Export_${new Date().toISOString().split('T')[0]}.txt`;
        link.click();
    };

    const toggleExportField = (field) => {
        setExportFields(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    // Format contacts data for table
    const tableData = contacts.map((contact) => ({
        ...contact,
        full_name: (
            <Link to={`/${username}/dashboard/contacts/${contact.contact_id}`} className="flex items-center gap-2 group/name">
                {contact.is_private === 1 && (
                    <Lock className="w-3 h-3 text-orange-500 flex-shrink-0" title="Private Contact" />
                )}
                <div>
                    <div className="font-medium group-hover/name:text-blue-600 transition-colors">
                        {contact.salutation} {contact.first_name} {contact.last_name}
                    </div>
                    {contact.designation && (
                        <div className="text-xs text-gray-500">{contact.designation}</div>
                    )}
                </div>
            </Link>
        ),
        company_name: contact.company_name || '-',
        email: contact.email || '-',
        phone: contact.country_code && contact.phone_number
            ? `${contact.country_code} ${contact.phone_number}`
            : '-',
        domain: contact.domain_name || contact.domain_free_text || '-',
        actions: (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/${username}/dashboard/contacts/${contact.contact_id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                    </DropdownMenuItem>
                    {hasPermission(PERMISSIONS.CONTACTS_UPDATE) && (
                        <DropdownMenuItem onClick={() => navigate(`/${username}/dashboard/contacts/${contact.contact_id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                    )}
                    {hasPermission(PERMISSIONS.CONTACTS_DELETE) && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => openDeleteDialog(contact)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    }));

    return (
        <div className="max-w-[1600px] mx-auto py-8 px-4">
            <PageHeader
                title="Contacts"
                description="Comprehensive directory of enterprise stakeholders, domain representatives, and individual profiles."
                breadcrumbItems={[{ label: "Contacts" }]}
                actions={
                    <div className="flex gap-4">
                        <Button
                            variant="ghost"
                            className="rounded-xl h-14 px-6 font-black uppercase tracking-widest text-[10px] text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all gap-2"
                            onClick={() => setExportDialogOpen(true)}
                        >
                            <FileDown className="w-5 h-5 mr-1" /> Export
                        </Button>
                        {hasPermission(PERMISSIONS.CONTACTS_CREATE) && (
                            <Link to={`/${username}/dashboard/contacts/new`}>
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-95 transition-all">
                                    <Plus className="w-5 h-5 mr-3" /> Add Contact
                                </Button>
                            </Link>
                        )}
                    </div>
                }
            />

            <div className="space-y-8 mt-12">
                {/* Control Bar */}
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl h-14 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all px-5">
                        <SearchFilterForm
                            search={search}
                            setSearch={setSearch}
                            placeholder="Search by name, company, email..."
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Table or Empty State */}
                {loading ? (
                    <div className="p-6 flex flex-col justify-center items-center">
                        <Hamster />
                    </div>
                ) : tableData.length > 0 ? (
                    <>
                        <GenericTable
                            headers={headers}
                            data={tableData}
                            primaryKey="contact_id"
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                            onSort={handleSort}
                        />
                        <Pagination
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            totalPages={totalPages}
                            totalRecords={totalRecords}
                        />
                    </>
                ) : (
                    <div className="p-10 border rounded-md bg-white text-center">
                        {debouncedSearch ? (
                            <>
                                <div className="text-lg font-semibold mb-2">No results found</div>
                                <div className="text-sm text-gray-600 mb-4">Try adjusting your search criteria.</div>
                            </>
                        ) : (
                            <>
                                <div className="text-lg font-semibold mb-2">No contacts yet</div>
                                <div className="text-sm text-gray-600 mb-4">Create your first contact to get started.</div>
                                {hasPermission(PERMISSIONS.CONTACTS_CREATE) && (
                                    <Link to={`/${username}/dashboard/contacts/new`}>
                                        <Button><Plus className="w-4 h-4" /> Add Contact</Button>
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={closeDeleteDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Contact</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete {contactToDelete?.first_name} {contactToDelete?.last_name}?
                                This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDeleteDialog}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDelete}>
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Export Dialog */}
                <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Export Contacts</DialogTitle>
                            <DialogDescription>
                                Select the export format and fields to include in the export.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            {/* Export Format */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Export Format</label>
                                <Select value={exportFormat} onValueChange={setExportFormat}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="csv">CSV (Comma-Separated Values)</SelectItem>
                                        <SelectItem value="text">Text Report (Formatted)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {exportFormat === 'csv'
                                        ? 'Download data as a CSV file for use in Excel or other spreadsheet applications.'
                                        : 'Download a formatted text report with detailed information.'}
                                </p>
                            </div>

                            {/* Fields Selection */}
                            <div>
                                <label className="text-sm font-medium mb-3 block">Fields to Include</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="export-name"
                                            checked={exportFields.name}
                                            onCheckedChange={() => toggleExportField('name')}
                                        />
                                        <label htmlFor="export-name" className="text-sm cursor-pointer">
                                            Name
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="export-designation"
                                            checked={exportFields.designation}
                                            onCheckedChange={() => toggleExportField('designation')}
                                        />
                                        <label htmlFor="export-designation" className="text-sm cursor-pointer">
                                            Designation
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="export-company"
                                            checked={exportFields.company}
                                            onCheckedChange={() => toggleExportField('company')}
                                        />
                                        <label htmlFor="export-company" className="text-sm cursor-pointer">
                                            Company
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="export-email"
                                            checked={exportFields.email}
                                            onCheckedChange={() => toggleExportField('email')}
                                        />
                                        <label htmlFor="export-email" className="text-sm cursor-pointer">
                                            Email
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="export-phone"
                                            checked={exportFields.phone}
                                            onCheckedChange={() => toggleExportField('phone')}
                                        />
                                        <label htmlFor="export-phone" className="text-sm cursor-pointer">
                                            Phone
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="export-domain"
                                            checked={exportFields.domain}
                                            onCheckedChange={() => toggleExportField('domain')}
                                        />
                                        <label htmlFor="export-domain" className="text-sm cursor-pointer">
                                            Domain
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                className="bg-green-500 hover:bg-green-600 text-white"
                                onClick={handleExport}
                                disabled={Object.values(exportFields).every(v => !v)}
                            >
                                <FileDown className="w-4 h-4 mr-2" /> Export Data
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
