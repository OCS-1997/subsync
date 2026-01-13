import { useNavigate } from "react-router-dom";
import ListSubscriptions from "./ListSubscriptions.jsx";

export default function SubscriptionsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50/30 dark:bg-transparent px-8 py-8">
      <div className="max-w-[1700px] mx-auto space-y-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ListSubscriptions
            onAddNew={() => navigate("add")}
            onEdit={(id) => navigate(`${id}/edit`)}
          />
        </div>
      </div>
    </div>
  );
}
