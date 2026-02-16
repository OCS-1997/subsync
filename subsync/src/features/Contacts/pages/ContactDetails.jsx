import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, Mail, Phone, Building2, Briefcase, Globe, Calendar, User2, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/breadcrumb';
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

    // Build full name without nulls
    const getFullName = () => {
        return [currentContact.salutation, currentContact.first_name, currentContact.last_name]
            .filter(part => part && part.trim())
            .join(' ');
    };

    const breadcrumbItems = [
        { label: 'Contacts', href: `/${username}/dashboard/contacts` },
        { label: getFullName() }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Page Header with Breadcrumb */}
            <PageHeader
                title={getFullName()}
                description={currentContact.designation || currentContact.company_name || 'Contact Details'}
                breadcrumbItems={breadcrumbItems}
                actions={
                    <Button 
                        onClick={() => navigate(`/${username}/dashboard/contacts/${id}/edit`)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Contact
                    </Button>
                }
            />

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Contact Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Primary Information Card */}
                    <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <User2 className="h-5 w-5 text-blue-600" />
                                Contact Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-5">
                            {/* Full Name */}
                            <div className="flex items-start gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <User2 className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Full Name</div>
                                    <div className="text-base font-semibold mt-1">
                                        {getFullName()}
                                    </div>
                                </div>
                            </div>

                            {/* Email */}
                            {currentContact.email && (
                                <div className="flex items-start gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                        <Mail className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Email</div>
                                        <a 
                                            href={`mailto:${currentContact.email}`} 
                                            className="text-base font-medium text-blue-600 hover:text-blue-700 hover:underline mt-1 block truncate"
                                        >
                                            {currentContact.email}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Phone */}
                            {currentContact.phone_number && (
                                <div className="flex items-start gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                    <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                                        <Phone className="h-4 w-4 text-violet-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Phone Number</div>
                                        <a 
                                            href={`tel:${currentContact.country_code}${currentContact.phone_number}`} 
                                            className="text-base font-medium text-blue-600 hover:text-blue-700 hover:underline mt-1 block"
                                        >
                                            {currentContact.country_code} {currentContact.phone_number}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Designation */}
                            {currentContact.designation && (
                                <div className="flex items-start gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                        <Briefcase className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Designation</div>
                                        <div className="text-base font-medium mt-1">{currentContact.designation}</div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Notes Card */}
                    {currentContact.notes && (
                        <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-b">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <MapPin className="h-5 w-5 text-amber-600" />
                                    Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="text-base whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {currentContact.notes}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column - Company & Meta */}
                <div className="space-y-6">
                    {/* Company & Domain Card */}
                    <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-b">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Building2 className="h-5 w-5 text-purple-600" />
                                Organization
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {currentContact.company_name ? (
                                <>
                                    <div>
                                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2 mb-2">
                                            <Building2 className="h-3.5 w-3.5" />
                                            Company
                                        </div>
                                        <div className="text-base font-semibold">{currentContact.company_name}</div>
                                    </div>

                                    {(currentContact.domain_name || currentContact.domain_free_text) && (
                                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2 mb-2">
                                                <Globe className="h-3.5 w-3.5" />
                                                Domain
                                            </div>
                                            <div className="text-base font-medium text-blue-600">
                                                {currentContact.domain_name || currentContact.domain_free_text}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                                    No company information available
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Metadata Card */}
                    <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 border-b">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Calendar className="h-5 w-5 text-slate-600" />
                                Metadata
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Contact ID</div>
                                <div className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                    {currentContact.contact_id}
                                </div>
                            </div>
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Created</div>
                                <div className="text-sm">
                                    {new Date(currentContact.created_at).toLocaleString('en-IN', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    })}
                                </div>
                            </div>
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Last Updated</div>
                                <div className="text-sm">
                                    {new Date(currentContact.updated_at).toLocaleString('en-IN', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
