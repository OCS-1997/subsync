import { useState } from "react";
import { useSelector } from "react-redux";
import { Briefcase, Settings } from "lucide-react";

import OpportunityList from "../components/OpportunityList.jsx";
import StatusManagement from "../components/StatusManagement.jsx";
import { Button } from "@/components/ui/button.jsx";
import { PERMISSIONS } from "@/constants/permissions.js"; // Assuming client-side permissions as well

const OpportunitiesPage = () => {
    const [activeTab, setActiveTab] = useState("all");
    // const { hasPermission } = usePermissions(); // If there's a hook

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                        <Briefcase className="h-6 w-6" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Opportunities</h1>
                </div>
            </div>

            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab("all")}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "all"
                            ? "border-blue-600 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                >
                    All Opportunities
                </button>
                <button
                    onClick={() => setActiveTab("statuses")}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "statuses"
                            ? "border-blue-600 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <Settings className="h-4 w-4" /> Manage Statuses
                    </span>
                </button>
            </div>

            <div>
                {activeTab === "all" ? (
                    <OpportunityList />
                ) : (
                    <StatusManagement />
                )}
            </div>
        </div>
    );
};

export default OpportunitiesPage;
