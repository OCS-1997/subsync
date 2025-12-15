import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Phone, Calendar, Clock, Building2, User, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb.jsx";
import Hamster from "@/components/animations/Hamster.jsx";
import { getDcrById, clearDcrState } from "../dcrSlice";
import { usePermissions } from "@/context/PermissionsContext";
import { PERMISSIONS } from "@/constants/permissions";

export default function ViewDCR() {
    const navigate = useNavigate();
    const { username, id } = useParams();
    const dispatch = useDispatch();
    const { currentEntry, loading } = useSelector((state) => state.dcr);
    const { hasPermission } = usePermissions();
    const isAdmin = hasPermission(PERMISSIONS.DCR_DELETE);

    useEffect(() => {
        if (id) {
            dispatch(getDcrById(id));
        }
        return () => {
            dispatch(clearDcrState());
        };
    }, [id, dispatch]);

    if (loading) {
        return (
            <div className="p-6 flex flex-col justify-center items-center">
                <Hamster />
            </div>
        );
    }

    if (!currentEntry) {
        return (
            <div className="p-6">
                <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">DCR entry not found</p>
                    <Button
                        className="mt-4"
                        onClick={() => navigate(`/${username}/dashboard/dcr`)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to List
                    </Button>
                </div>
            </div>
        );
    }

    const entry = currentEntry;
    const canEdit = isAdmin || entry.user_id === username;

    const formatDateTime = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="p-6">
            <Breadcrumb
                items={[
                    { label: "Daily Call Reports", href: `/${username}/dashboard/dcr` },
                    { label: `DCR #${entry.id}` }
                ]}
                className="mb-4"
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold dark:text-white">DCR Entry #{entry.id}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Created {formatDateTime(entry.created_at)}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/${username}/dashboard/dcr`)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to List
                    </Button>
                    {canEdit && (
                        <Button
                            onClick={() => navigate(`/${username}/dashboard/dcr/${entry.id}/edit`)}
                        >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit Entry
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                {/* Core Information */}
                <Card>
                    <CardHeader className="border-b">
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="w-5 h-5" />
                            Call Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                                    Date
                                </label>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <p className="text-base dark:text-white">{formatDate(entry.timestamp)}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                                    Time Spent
                                </label>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <p className="text-base dark:text-white">{entry.time_spent || `${Math.floor(entry.time_spent_minutes / 60)}:${String(entry.time_spent_minutes % 60).padStart(2, '0')}`}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                                    Call Type
                                </label>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                    ${entry.call_type === 'incoming' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                    ${entry.call_type === 'outgoing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
                    ${entry.call_type === 'follow-up' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : ''}
                  `}>
                                        {entry.call_type.charAt(0).toUpperCase() + entry.call_type.slice(1).replace('-', ' ')}
                                    </span>
                                </div>
                            </div>

                            {entry.user_name && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                                        User
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <p className="text-base dark:text-white">{entry.user_name}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Domain / Company Details */}
                <Card>
                    <CardHeader className="border-b">
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Domain / Company Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                                    Domain
                                </label>
                                <p className="text-base dark:text-white">
                                    {entry.domain_name || entry.domain_free_text || "-"}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                                    Company Name
                                </label>
                                <p className="text-base dark:text-white">
                                    {entry.company_name || "-"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Details */}
                <Card>
                    <CardHeader className="border-b">
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Contact Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                                    Contact Name
                                </label>
                                <p className="text-base dark:text-white">
                                    {entry.contact_name || "-"}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                                    Email
                                </label>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <p className="text-base dark:text-white">
                                        {entry.contact_email ? (
                                            <a href={`mailto:${entry.contact_email}`} className="text-blue-600 hover:underline">
                                                {entry.contact_email}
                                            </a>
                                        ) : "-"}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                                    Phone Number
                                </label>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <p className="text-base dark:text-white">
                                        {entry.contact_phone_country_code && entry.contact_phone_number
                                            ? `${entry.contact_phone_country_code} ${entry.contact_phone_number}`
                                            : "-"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Description */}
                <Card>
                    <CardHeader className="border-b">
                        <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="whitespace-pre-wrap text-base dark:text-white bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                            {entry.notes || "No description provided"}
                        </div>
                    </CardContent>
                </Card>

                {/* Metadata */}
                <Card className="bg-gray-50 dark:bg-gray-800/50">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                                <span className="font-medium">Created:</span> {formatDateTime(entry.created_at)}
                            </div>
                            <div>
                                <span className="font-medium">Last Updated:</span> {formatDateTime(entry.updated_at)}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
