import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Breadcrumb } from '@/components/ui/breadcrumb.jsx';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import Hamster from '@/components/animations/Hamster.jsx';
import { fetchContacts, deleteContact, clearError } from '../contactsSlice';

export default function ContactsList() {
    const navigate = useNavigate();
    const { username } = useParams();
    const dispatch = useDispatch();
    const { contacts, loading, error, totalPages, currentPage } = useSelector((state) => state.contacts);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState(null);

    useEffect(() => {
        loadContacts();
    }, [page, search]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearError());
        }
    }, [error]);

    const loadContacts = () => {
        dispatch(fetchContacts({ page, limit: 20, search }));
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleDelete = async () => {
        if (!contactToDelete) return;

        try {
            await dispatch(deleteContact(contactToDelete.contact_id)).unwrap();
            toast.success('Contact deleted successfully!');
            setDeleteDialogOpen(false);
            setContactToDelete(null);
            loadContacts();
        } catch (err) {
            toast.error(err || 'Failed to delete contact');
        }
    };

    if (loading && contacts.length === 0) {
        return (
            <div className="p-6 flex flex-col justify-center items-center">
                <Hamster />
            </div>
        );
    }

    return (
        <div className="p-6">
            <Breadcrumb items={[{ label: "Contacts" }]} />
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold dark:text-white">Contacts</h1>
                <Button onClick={() => navigate(`/${username}/dashboard/contacts/new`)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                </Button>
            </div>

            {/* Search */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="text"
                            placeholder="Search contacts by name, email, company, or phone..."
                            value={search}
                            onChange={handleSearch}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Contacts Table */}
            <Card>
                <CardHeader className="border-b">
                    <CardTitle>All Contacts ({contacts.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {contacts.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No contacts found. {search && 'Try adjusting your search.'}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Domain</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contacts.map((contact) => (
                                    <TableRow key={contact.contact_id}>
                                        <TableCell className="font-medium">
                                            {contact.salutation} {contact.first_name} {contact.last_name}
                                            {contact.designation && (
                                                <span className="text-xs text-gray-500 block">{contact.designation}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{contact.company_name || '-'}</TableCell>
                                        <TableCell>{contact.email || '-'}</TableCell>
                                        <TableCell>
                                            {contact.country_code && contact.phone_number
                                                ? `${contact.country_code} ${contact.phone_number}`
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {contact.domain_name || contact.domain_free_text || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => navigate(`/${username}/dashboard/contacts/${contact.contact_id}`)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => navigate(`/${username}/dashboard/contacts/${contact.contact_id}/edit`)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setContactToDelete(contact);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <span className="flex items-center px-4">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Contact</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {contactToDelete?.first_name} {contactToDelete?.last_name}?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
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
