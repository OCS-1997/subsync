import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import api from "@/lib/axiosInstance.js";
import Hamster from "@/components/animations/Hamster.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog.jsx";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";

import ViewSubscription from "./ViewSubscription.jsx";

export default function ViewSubscriptionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmValue, setDeleteConfirmValue] = useState("");

  const username = location.pathname.split("/")[1] || "";

  const fetchSubscription = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/subscriptions/${id}`);
      setSubscription(res.data.subscription || null);
    } catch (e) {
      toast.error(e.normalizedMessage || "Failed to load subscription");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleBack = () => {
    navigate(`/${username}/dashboard/subscriptions`);
  };

  const handleEdit = () => {
    navigate(`/${username}/dashboard/subscriptions/${id}/edit`);
  };

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
    setDeleteConfirmValue("");
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteConfirmValue("");
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await api.delete(`/subscriptions/${id}`);
      toast.success("Subscription deleted successfully");
      closeDeleteDialog();
      navigate(`/${username}/dashboard/subscriptions`);
    } catch (e) {
      toast.error(e.normalizedMessage || "Failed to delete subscription");
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col justify-center items-center">
        <Hamster />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-6">
        <button
          onClick={handleBack}
          className="mb-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back to Subscriptions</span>
        </button>
        <p className="text-sm text-gray-600">Subscription not found.</p>
      </div>
    );
  }

  const domainName = subscription.domain_name || "";

  const canDelete = hasPermission(PERMISSIONS.SUBSCRIPTIONS_DELETE);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back</span>
        </button>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleEdit}
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          {canDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={openDeleteDialog}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-2">Subscription Details</h1>

      <ViewSubscription
        subscription={subscription}
        onEdit={handleEdit}
        onDelete={canDelete ? openDeleteDialog : undefined}
        showActions={false}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subscription</DialogTitle>
            <DialogDescription>
              Type the subscription domain name{" "}
              <strong>{domainName || "subscription"}</strong> to confirm
              deletion. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Label htmlFor="delete-confirm-input-details">
              Subscription Name
            </Label>
            <Input
              id="delete-confirm-input-details"
              value={deleteConfirmValue}
              onChange={(e) => setDeleteConfirmValue(e.target.value)}
              placeholder="Enter subscription name"
            />
          </div>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={
                !domainName ||
                deleteConfirmValue.trim().toLowerCase() !==
                  domainName.trim().toLowerCase()
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



