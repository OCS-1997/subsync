import { Settings2, Loader2, Trash2, Pencil, X, AlertTriangle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import {
  fetchVendors,
  deleteVendor,
  fetchVendorById,
  clearVendorState,
} from "@/features/Services/vendorSlice";

import AddVendorModal from "./AddVendorModal";

const ManageVendorsModal = ({ onVendorsUpdated }) => {
  const dispatch = useDispatch();
  const { list: vendors, loading, error, currentVendor } = useSelector(
    (state) => state.vendors
  );

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoadingVendorDetails, setIsLoadingVendorDetails] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeletingVendor, setIsDeletingVendor] = useState(false);

  useEffect(() => {
    if (isManageModalOpen) {
      dispatch(fetchVendors());
    }
  }, [isManageModalOpen, dispatch]);

  const handleDeleteVendor = async (vendorId) => {
    if (isDeletingVendor) return; // Prevent multiple calls
    
    setIsDeletingVendor(true);
    try {
      //console.log("Deleting vendor with ID:", vendorId);
      
      // The deleteVendor action already handles toast notifications and state updates
      await dispatch(deleteVendor(vendorId)).unwrap();
      
      // Call the parent callback to update other parts of the app
      if (onVendorsUpdated) {
        onVendorsUpdated();
      }
      
      // Close the delete confirmation dialog
      setDeleteTarget(null);
      
      //console.log("Vendor deleted successfully");
    } catch (err) {
      console.error("Error deleting vendor:", err);
      // Error toast is already handled by the Redux action
    } finally {
      setIsDeletingVendor(false);
    }
  };

  const handleEditVendor = async (vendor) => {
    try {
      setIsLoadingVendorDetails(true);
      await dispatch(fetchVendorById(vendor.vendor_id)).unwrap();
      setEditingVendor(vendor);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Error fetching vendor details:", error);
      toast.error("Failed to load vendor details for editing");
    } finally {
      setIsLoadingVendorDetails(false);
    }
  };

  const handleVendorUpdated = () => {
    setIsEditModalOpen(false);
    setEditingVendor(null);
    dispatch(clearVendorState());
    onVendorsUpdated();
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingVendor(null);
    dispatch(clearVendorState());
  };

  return (
    <>
      {/* Manage Vendors Modal */}
      <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={loading}
            title="Manage Vendors"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Manage Vendors
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Add, edit, or remove vendors from your system.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <AddVendorModal onVendorAdded={onVendorsUpdated} />

            <div className="max-h-[400px] overflow-y-auto space-y-3">
              {loading && (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-500">Loading vendors...</span>
                </div>
              )}

              {error && (
                <p className="text-center text-red-500">
                  Error: {error.message || String(error)}
                </p>
              )}

              {!loading && !error && vendors.length === 0 && (
                <div className="text-center py-6 text-gray-500 border rounded-lg">
                  No vendors found. Add one to get started!
                </div>
              )}

              {!loading &&
                !error &&
                vendors.map((vendor) => (
                  <div
                    key={vendor.vendor_id}
                    className="flex items-center justify-between gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <span className="font-medium text-gray-900">
                      {vendor.display_name}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditVendor(vendor)}
                        disabled={loading || isLoadingVendorDetails}
                      >
                        {isLoadingVendorDetails ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Pencil className="h-4 w-4 mr-1" />
                        )}
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          //console.log("Setting delete target:", vendor);
                          setDeleteTarget(vendor);
                        }}
                        disabled={loading || isDeletingVendor}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsManageModalOpen(false)}
              disabled={loading}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Delete Vendor
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {deleteTarget?.display_name}
                  </span>
                  ? This action cannot be undone and will permanently remove all associated data.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <DialogFooter className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteTarget(null)}
              disabled={isDeletingVendor}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteVendor(deleteTarget.vendor_id)}
              disabled={isDeletingVendor}
            >
              {isDeletingVendor ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              {isDeletingVendor ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Modal */}
      {editingVendor && currentVendor && (
        <AddVendorModal
          isEditing={true}
          editableVendor={currentVendor}
          onVendorAdded={handleVendorUpdated}
          isOpen={isEditModalOpen}
          setIsOpen={setIsEditModalOpen}
        />
      )}
    </>
  );
};

export default ManageVendorsModal;
