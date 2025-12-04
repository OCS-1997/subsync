import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Mail, Phone, Building2, Briefcase, Globe } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Hamster from '@/components/animations/Hamster.jsx';
import { fetchContactById, clearCurrentContact, clearError } from '../contactsSlice';

export default function ContactDetails() {
    const navigate = useNavigate();
    const { username, id } = useParams();
    const dispatch = useDispatch();
    const { currentContact, loading, error } = useSelector((state) => state.contacts);

    useEffect(() => {
        dispatch(fetchContactById(id));
        return () => {
            dispatch(clearCurrentContact());
        };
    }, [id, dispatch]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearError());
        }
    }, [error, dispatch]);

    if (loading) {
        return (
            <div className="p-6 flex flex-col justify-center items-center">
                <Hamster />
            </div>
        );
    }

    if (!currentContact) {
        return (
            <div className="p-6">
                <div className="text-center text-gray-500">Contact not found</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/${username}/dashboard/contacts`)}
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    Dashboard / Contacts / Contact Details
                </span>
            </div>

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold dark:text-white">
                    {currentContact.salutation} {currentContact.first_name} {currentContact.last_name}
                </h1>
                <Button onClick={() => navigate(`/${username}/dashboard/contacts/${id}/edit`)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Contact
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader className="border-b">
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Full Name</div>
                            <div className="text-base font-medium mt-1">
                                {currentContact.salutation} {currentContact.first_name} {currentContact.last_name}
                            </div>
                        </div>

                        {currentContact.designation && (
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" />
                                    Designation
                                </div>
                                <div className="text-base font-medium mt-1">{currentContact.designation}</div>
                            </div>
                        )}

                        {currentContact.email && (
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Email
                                </div>
                                <div className="text-base font-medium mt-1">
                                    <a href={`mailto:${currentContact.email}`} className="text-blue-600 hover:underline">
                                        {currentContact.email}
                                    </a>
                                </div>
                            </div>
                        )}

                        {currentContact.phone_number && (
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    Phone
                                </div>
                                <div className="text-base font-medium mt-1">
                                    <a href={`tel:${currentContact.country_code}${currentContact.phone_number}`} className="text-blue-600 hover:underline">
                                        {currentContact.country_code} {currentContact.phone_number}
                                    </a>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Company & Domain */}
                <Card>
                    <CardHeader className="border-b">
                        <CardTitle>Company & Domain</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {currentContact.company_name && (
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    Company
                                </div>
                                <div className="text-base font-medium mt-1">{currentContact.company_name}</div>
                            </div>
                        )}

                        {(currentContact.domain_name || currentContact.domain_free_text) && (
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    Domain
                                </div>
                                <div className="text-base font-medium mt-1">
                                    {currentContact.domain_name || currentContact.domain_free_text}
                                </div>
                            </div>
                        )}

                        {!currentContact.company_name && !currentContact.domain_name && !currentContact.domain_free_text && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                No company or domain information available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Notes */}
                {currentContact.notes && (
                    <Card className="lg:col-span-2">
                        <CardHeader className="border-b">
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="text-base whitespace-pre-wrap">{currentContact.notes}</div>
                        </CardContent>
                    </Card>
                )}

                {/* Metadata */}
                <Card className="lg:col-span-2">
                    <CardHeader className="border-b">
                        <CardTitle>Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <div className="text-gray-500 dark:text-gray-400">Contact ID</div>
                                <div className="font-mono mt-1">{currentContact.contact_id}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 dark:text-gray-400">Created At</div>
                                <div className="mt-1">
                                    {new Date(currentContact.created_at).toLocaleString('en-IN', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    })}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-500 dark:text-gray-400">Last Updated</div>
                                <div className="mt-1">
                                    {new Date(currentContact.updated_at).toLocaleString('en-IN', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    })}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
