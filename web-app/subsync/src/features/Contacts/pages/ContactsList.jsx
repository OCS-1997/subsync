import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Lock, MoreVertical } from 'lucide-react';
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
import Hamster from '@/components/animations/Hamster.jsx';
import GenericTable from '@/components/layouts/GenericTable.jsx';
import Pagination from '@/components/layouts/Pagination.jsx';
import SearchFilterForm from '@/components/layouts/SearchFilterForm.jsx';
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

    // Format contacts data for table
    const tableData = contacts.map((contact) => ({
        ...contact,
        full_name: (
            <div className="flex items-center gap-2">
                {contact.is_private === 1 && (
                    <Lock className="w-3 h-3 text-orange-500 flex-shrink-0" title="Private Contact" />
                )}
                <div>
                    <div className="font-medium">
                        {contact.salutation} {contact.first_name} {contact.last_name}
                    </div>
                    {contact.designation && (
                        <div className="text-xs text-gray-500">{contact.designation}</div>
                    )}
                </div>
            </div>
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
        <div className="p-4">
            <Breadcrumb items={[{ label: "Contacts" }]} />

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h1 className="text-2xl font-bold">Contacts</h1>
                {hasPermission(PERMISSIONS.CONTACTS_CREATE) && (
                    <Link to={`/${username}/dashboard/contacts/new`}>
                        <Button className="bg-blue-500 hover:bg-blue-600 text-white w-40">
                            <Plus className="w-4 h-4" /> Add
                        </Button>
                    </Link>
                )}
            </div>

            <hr className="mb-6 border-blue-500 border-1" />

            {/* Search Bar */}
            <div className="flex items-center gap-3 mb-3">
                <SearchFilterForm
                    search={search}
                    setSearch={setSearch}
                    handleSearch={handleSearch}
                />
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
        </div>
    );
}
