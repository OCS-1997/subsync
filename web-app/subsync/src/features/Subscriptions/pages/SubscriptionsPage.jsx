import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import ListSubscriptions from "./ListSubscriptions.jsx";
import ArchivedSubscriptions from "./ArchivedSubscriptions.jsx";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isArchived = location.pathname.includes('/archived');
  const username = location.pathname.split('/')[1] || '';

  return (
    <div>
      <Tabs value={isArchived ? "archived" : "active"} className="w-full">
        <TabsList className="mt-4">
          <TabsTrigger
            value="active"
            onClick={() => navigate(`/${username}/dashboard/subscriptions`)}
          >
            Active Subscriptions
          </TabsTrigger>
          <TabsTrigger
            value="archived"
            onClick={() => navigate(`/${username}/dashboard/subscriptions/archived`)}
          >
            Archived Subscriptions
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Routes>
        <Route
          path="archived"
          element={
            <ArchivedSubscriptions
              onEdit={(id) => navigate(`${id}/edit`)}
            />
          }
        />
        <Route
          index
          element={
            <ListSubscriptions
              onAddNew={() => navigate("add")}
              onEdit={(id) => navigate(`${id}/edit`)}
            />
          }
        />
      </Routes>
    </div>
  );
}
