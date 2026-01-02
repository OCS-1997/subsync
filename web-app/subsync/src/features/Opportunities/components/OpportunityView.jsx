import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, User, Building2, Calendar, DollarSign, Package, Globe, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { PageHeader } from '@/components/ui/breadcrumb.jsx';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog.jsx';
import Hamster from '@/components/animations/Hamster.jsx';
import { fetchOpportunityById, clearCurrentOpportunity } from '../opportunitySlice.js';
import opportunityService from '../services/opportunityService.js';

export default function OpportunityView() {
    const navigate = useNavigate();
    const { username, id } = useParams();
    const dispatch = useDispatch();
    const { currentOpportunity, loading } = useSelector((state) => state.opportunities);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const baseUrl = `/${username}/dashboard`;

    useEffect(() => {
        dispatch(fetchOpportunityById(id));
        return () => {
            dispatch(clearCurrentOpportunity());
        };
    }, [id, dispatch]);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await opportunityService.deleteOpportunity(id);
            toast.success('Opportunity deleted successfully');
            navigate(`${baseUrl}/opportunities`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete opportunity');
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex flex-col justify-center items-center">
                <Hamster />
            </div>
        );
    }

    if (!currentOpportunity) {
        return (
            <div className="p-6">
                <div className="text-center text-gray-500">Opportunity not found</div>
            </div>
        );
    }

    const breadcrumbItems = [
        { label: 'Opportunities', href: `${baseUrl}/opportunities` },
        { label: 'View Opportunity' }
    ];

    return (
        <div className="w-full space-y-6 pb-12 px-2 md:px-6">
            <PageHeader
                title={`Opportunity: ${currentOpportunity.customer_name}`}
                description={`Viewing details for opportunity ${currentOpportunity.opportunity_id}`}
                breadcrumbItems={breadcrumbItems}
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(true)}
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                        <Button
                            onClick={() => navigate(`${baseUrl}/opportunities/edit/${id}`)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Opportunity
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card className="border-none shadow-sm bg-white dark:bg-gray-800/50">
                    <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-500" />
                            Customer Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Customer</div>
                            <div className="text-base font-medium mt-1">{currentOpportunity.customer_name}</div>
                            {currentOpportunity.company_name && (
                                <div className="text-sm text-gray-600 dark:text-gray-400">{currentOpportunity.company_name}</div>
                            )}
                        </div>

                        <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Opportunity Type</div>
                            <div className="text-base font-medium mt-1">{currentOpportunity.opportunity_type}</div>
                        </div>

                        {currentOpportunity.referred_by && (
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Referred By</div>
                                <div className="text-base font-medium mt-1">{currentOpportunity.referred_by}</div>
                            </div>
                        )}

                        {currentOpportunity.domain && (
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    Related Domain
                                </div>
                                <div className="text-base font-medium mt-1 font-mono text-sm">{currentOpportunity.domain}</div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Opportunity Details */}
                <Card className="border-none shadow-sm bg-white dark:bg-gray-800/50">
                    <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-500" />
                            Opportunity Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Opportunity Date
                            </div>
                            <div className="text-base font-medium mt-1">
                                {new Date(currentOpportunity.opportunity_date).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Estimated Value</div>
                            <div className="text-2xl font-bold mt-1 text-green-600 dark:text-green-500">
                                {new Intl.NumberFormat('en-IN', {
                                    style: 'currency',
                                    currency: 'INR',
                                    maximumFractionDigits: 0
                                }).format(currentOpportunity.opportunity_value)}
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Current Stage</div>
                            <div className="mt-2">
                                <Badge
                                    className="font-medium text-sm px-3 py-1"
                                    style={{
                                        backgroundColor: currentOpportunity.status_color || '#3b82f6',
                                        color: 'white'
                                    }}
                                >
                                    {currentOpportunity.status_name}
                                </Badge>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Owner
                            </div>
                            <div className="text-base font-medium mt-1">{currentOpportunity.owner_name || currentOpportunity.owner}</div>
                        </div>

                        {currentOpportunity.last_contacted_at && (
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Last Contacted</div>
                                <div className="text-base font-medium mt-1">
                                    {new Date(currentOpportunity.last_contacted_at).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Products/Services */}
                <Card className="border-none shadow-sm bg-white dark:bg-gray-800/50">
                    <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-purple-500" />
                            Products / Services
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="text-base whitespace-pre-wrap">{currentOpportunity.product_services}</div>
                    </CardContent>
                </Card>

                {/* Remarks */}
                {currentOpportunity.remarks && (
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-800/50">
                        <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-orange-500" />
                                Internal Remarks
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="text-base whitespace-pre-wrap">{currentOpportunity.remarks}</div>
                        </CardContent>
                    </Card>
                )}

                {/* Metadata */}
                <Card className="lg:col-span-2 border-none shadow-sm bg-white dark:bg-gray-800/50">
                    <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                        <CardTitle>Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <div className="text-gray-500 dark:text-gray-400">Opportunity ID</div>
                                <div className="font-mono mt-1">{currentOpportunity.opportunity_id}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 dark:text-gray-400">Customer ID</div>
                                <div className="font-mono mt-1">{currentOpportunity.customer_id}</div>
                            </div>
                            {currentOpportunity.contact_person_id && (
                                <div>
                                    <div className="text-gray-500 dark:text-gray-400">Contact Person ID</div>
                                    <div className="font-mono mt-1">{currentOpportunity.contact_person_id}</div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this opportunity. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
