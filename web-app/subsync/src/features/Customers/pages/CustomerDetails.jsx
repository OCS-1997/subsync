import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Edit2, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";

import { fetchCustomerById, clearCustomerState } from "@/features/Customers/customerSlice.js";

import DisplayCustomer from "../components/DisplayCustomer.jsx";

function CustomerDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentCustomer, loading, error } = useSelector((state) => state.customers);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (id) {
      dispatch(fetchCustomerById(id));
    }
    return () => {
      dispatch(clearCustomerState());
    };
  }, [id, dispatch]);

  const handleEdit = () => {
    const userSegment = location.pathname.split("/")[1];
    navigate(`/${userSegment}/dashboard/customers/${id}/edit`, { state: { editableCustomerId: id } });
  };

  if (loading) return <SkeletonLoader />;
  if (error) return <ErrorMessage message={error} />;
  if (!currentCustomer) return <p>No customer data available.</p>;

  return (
    <div className="container py-8 max-w mx-auto px-4 md:px-0">
      <PageHeader
        title={currentCustomer.display_name || "Customer Hub"}
        description={`Manage financial records and logistical parameters for ${currentCustomer.company_name || 'this individual'}.`}
        breadcrumbItems={[
          { label: "Customers", href: `/${location.pathname.split('/')[1]}/dashboard/customers` },
          { label: currentCustomer?.display_name || 'Profile' }
        ]}
        actions={
          <Button
            onClick={handleEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-95 transition-all"
          >
            <Edit2 className="w-4 h-4 mr-3" />
            Edit Profile
          </Button>
        }
      />

      <div className="mt-12">
        <DisplayCustomer customerDetails={currentCustomer} />
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
      <p className="text-red-500">Error: {message}</p>
    </div>
  );
}

export default CustomerDetails;
