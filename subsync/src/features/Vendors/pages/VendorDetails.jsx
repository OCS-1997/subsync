import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Edit } from "lucide-react";

import { Button } from "@/components/ui/button.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";

import { fetchVendorById, clearVendorState } from "@/features/Services/vendorSlice.js";
import DisplayVendor from "../components/DisplayVendor.jsx";

function VendorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { currentVendor, loading, error } = useSelector((state) => state.vendors);

  useEffect(() => {
    if (id) {
      dispatch(fetchVendorById(id));
    }
    return () => {
      dispatch(clearVendorState());
    };
  }, [id, dispatch]);

  const handleEdit = () => {
    const currentPath = location.pathname;
    const userSegment = currentPath.split("/")[1];
    navigate(`/${userSegment}/dashboard/vendors/${id}/edit`);
  };

  if (loading) return <SkeletonLoader />;
  if (error) return <ErrorMessage message={error} />;
  if (!currentVendor) return <p>No vendor data available.</p>;

  return (
    <div className="container py-8 max-w-none mx-auto px-4 md:px-8">
      <PageHeader
        title={currentVendor.display_name || "Vendor Hub"}
        description={`Enterprise profile and procurement parameters for ${currentVendor.company_name || 'this supplier'}.`}
        breadcrumbItems={[
          { label: "Vendors", href: `/${location.pathname.split('/')[1]}/dashboard/vendors` },
          { label: currentVendor.display_name || 'Profile' }
        ]}
        actions={
          <Button
            onClick={handleEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-95 transition-all"
          >
            <Edit size={16} className="mr-3" />
            Edit Profile
          </Button>
        }
      />

      <div className="mt-12">
        <DisplayVendor vendor={currentVendor} />
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <Skeleton className="h-12 w-3/4 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
    </div>
  );
}

function ErrorMessage({ message }) {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <p className="text-red-500 font-bold">Error: {message}</p>
    </div>
  );
}

export default VendorDetails;
