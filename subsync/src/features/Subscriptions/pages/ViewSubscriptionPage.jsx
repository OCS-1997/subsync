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
    <div className="w-full h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      {/* Header / Navigation */}
      <header className="px-10 py-8 border-b border-gray-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 hover:text-blue-700 mb-2 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Subscriptions
            </button>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Subscription Details
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="lg"
              variant="outline"
              onClick={handleEdit}
              className="rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] border-gray-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              <Edit className="w-4 h-4 mr-3" />
              Edit
            </Button>
            {canDelete && (
              <Button
                size="lg"
                variant="destructive"
                onClick={openDeleteDialog}
                className="rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-red-500/20 active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4 mr-3" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-10">
        <ViewSubscription
          subscription={subscription}
          onEdit={handleEdit}
          onDelete={canDelete ? openDeleteDialog : undefined}
          showActions={false}
        />
      </div>

      {/* Delete confirmation dialog - Premium Styled */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      >
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900">
          <div className="p-10 bg-red-600">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-6 text-white">
              <Trash2 className="w-10 h-10" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-white mb-2 tracking-tight">Delete Subscription</DialogTitle>
              <DialogDescription className="text-red-100 text-sm font-medium leading-relaxed opacity-90">
                Type the subscription domain name{" "}
                <span className="font-black text-white underline decoration-2 underline-offset-4 mx-1">"{domainName || "subscription"}"</span>
                to confirm deletion. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-10 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="delete-confirm-input-details" className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Subscription Name
              </Label>
              <Input
                id="delete-confirm-input-details"
                value={deleteConfirmValue}
                onChange={(e) => setDeleteConfirmValue(e.target.value)}
                placeholder="Enter subscription name"
                className="h-14 rounded-2xl border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
              />
            </div>
            <div className="flex gap-4">
              <Button
                variant="ghost"
                onClick={closeDeleteDialog}
                className="rounded-2xl h-14 flex-1 font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
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
                className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-14 flex-1 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-red-500/30 active:scale-95 transition-all"
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}




