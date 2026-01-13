import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";
import {
  Loader2, FileText, Search, Calendar, Filter, X,
  CheckCircle, XCircle, Clock, AlertCircle, Info
} from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card.jsx";

const NotificationLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    subscription_id: "",
    template_key: "",
    domain_name: "",
    start_date: "",
    end_date: "",
    status: "",
  });
  const [templates, setTemplates] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });
  const [subscriptionDetails, setSubscriptionDetails] = useState({});
  const [loadingSubId, setLoadingSubId] = useState(null);

  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const { username } = useParams();
  const canView = hasPermission(PERMISSIONS.NOTIFICATION_LOGS_VIEW);

  useEffect(() => {
    fetchTemplates();
    fetchLogs();
  }, [filters, pagination.page]);

  const fetchTemplates = async () => {
    try {
      const response = await api.get("/email-templates");
      setTemplates(response.data || []);
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  };

  const fetchLogs = async () => {
    if (!canView) return;

    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "")
        ),
      };

      const response = await api.get("/notification-logs", { params });
      setLogs(response.data.logs || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 1,
      }));
    } catch (error) {
      toast.error("Failed to load notification logs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newValue = value === "_all" ? "" : value;
    setFilters(prev => ({ ...prev, [key]: newValue }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      subscription_id: "",
      template_key: "",
      domain_name: "",
      start_date: "",
      end_date: "",
      status: "",
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const fetchSubscriptionDetails = async (subId) => {
    if (subscriptionDetails[subId]) return subscriptionDetails[subId];

    setLoadingSubId(subId);
    try {
      const response = await api.get(`/subscriptions/${subId}`);
      const details = response.data.subscription;
      setSubscriptionDetails(prev => ({ ...prev, [subId]: details }));
      return details;
    } catch (error) {
      console.error("Failed to load subscription details:", error);
      return null;
    } finally {
      setLoadingSubId(null);
    }
  };

  const SubscriptionCell = ({ subId }) => {
    const [details, setDetails] = useState(subscriptionDetails[subId] || null);
    const [isOpen, setIsOpen] = useState(false);

    const handleOpenChange = async (open) => {
      setIsOpen(open);
      if (open && !details) {
        const fetchedDetails = await fetchSubscriptionDetails(subId);
        setDetails(fetchedDetails);
      }
    };

    return (
      <HoverCard openDelay={200} closeDelay={100} open={isOpen} onOpenChange={handleOpenChange}>
        <HoverCardTrigger asChild>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/${username}/dashboard/subscriptions/${subId}`);
            }}  
            className="text-blue-600 hover:underline font-mono text-sm cursor-pointer flex items-center gap-1"
          >
            {subId}
            <Info className="w-3 h-3 opacity-50" />
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-96" side="right" align="start">
          {loadingSubId === subId ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="ml-2 text-sm">Loading...</span>
            </div>
          ) : details ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-semibold text-sm">Subscription Details</h4>
                <Badge variant={details.status === 'active' ? 'default' : 'secondary'}>
                  {details.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Domain</p>
                  <p className="font-medium">{details.domain_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Currency</p>
                  <p className="font-medium">{details.currency || 'INR'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {details.start_date ? new Date(details.start_date).toLocaleDateString('en-IN') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {details.end_date ? new Date(details.end_date).toLocaleDateString('en-IN') : 'Never'}
                  </p>
                </div>
              </div>

              <div className="border-t pt-2">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Subtotal</p>
                    <p className="font-medium">{details.currency} {parseFloat(details.subtotal || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tax</p>
                    <p className="font-medium">{details.currency} {parseFloat(details.tax_total || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-semibold text-primary">{details.currency} {parseFloat(details.total || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {details.notes && (
                <div className="border-t pt-2">
                  <p className="text-muted-foreground text-xs">Notes</p>
                  <p className="text-xs mt-1 line-clamp-2">{details.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground p-4 text-center">
              Failed to load subscription details
            </div>
          )}
        </HoverCardContent>
      </HoverCard>
    );
  };

  const getStatusBadge = (status) => {
    const variants = {
      sent: { variant: "default", icon: CheckCircle, className: "bg-green-500/10 text-green-600" },
      failed: { variant: "destructive", icon: XCircle, className: "bg-red-500/10 text-red-600" },
      queued: { variant: "secondary", icon: Clock, className: "bg-blue-500/10 text-blue-600" },
      skipped: { variant: "outline", icon: AlertCircle, className: "bg-gray-500/10 text-gray-600" },
    };

    const config = variants[status] || variants.queued;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  if (!canView) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-lg font-medium">You don't have permission to view notification logs</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Notification Logs</h1>
              <p className="text-sm text-muted-foreground mt-1">
                View all sent notifications and their status
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-card/20 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[180px]">
            <Label className="text-xs mb-2">Subscription ID</Label>
            <Input
              placeholder="SUB001"
              value={filters.subscription_id}
              onChange={(e) => handleFilterChange("subscription_id", e.target.value)}
              className="h-9"
            />
          </div>

          <div className="flex-1 min-w-[180px]">
            <Label className="text-xs mb-2">Domain Name</Label>
            <Input
              placeholder="example.com"
              value={filters.domain_name}
              onChange={(e) => handleFilterChange("domain_name", e.target.value)}
              className="h-9"
            />
          </div>

          <div className="flex-1 min-w-[180px]">
            <Label className="text-xs mb-2">Template</Label>
            <Select
              value={filters.template_key}
              onValueChange={(value) => handleFilterChange("template_key", value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All templates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All templates</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.template_key} value={template.template_key}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <Label className="text-xs mb-2">Start Date</Label>
            <Input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange("start_date", e.target.value)}
              className="h-9"
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <Label className="text-xs mb-2">End Date</Label>
            <Input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange("end_date", e.target.value)}
              className="h-9"
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <Label className="text-xs mb-2">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="h-9"
          >
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="h-[40vh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-lg font-medium animate-pulse">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="h-[40vh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <FileText className="w-12 h-12 opacity-20" />
            <p className="text-lg font-medium">No notification logs found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subscription ID</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Provider ID</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <SubscriptionCell subId={log.subscription_id} />
                    </TableCell>
                    <TableCell className="font-medium text-sm">{log.domain_name || "N/A"}</TableCell>
                    <TableCell>{log.customer_name || "N/A"}</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {templates.find(t => t.template_key === log.template_key)?.name || log.template_key}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(log.sent_at)}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell>{log.attempt || 0}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.provider_id ? (
                        <span className="text-muted-foreground truncate max-w-[150px] inline-block" title={log.provider_id}>
                          {log.provider_id}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {log.error ? (
                        <span className="text-xs text-destructive truncate block" title={log.error}>
                          {log.error}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationLogs;

