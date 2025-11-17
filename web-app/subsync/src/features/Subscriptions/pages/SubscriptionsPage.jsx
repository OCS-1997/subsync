import { useNavigate } from "react-router-dom";
import ListSubscriptions from "./ListSubscriptions.jsx";

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  return (
    <ListSubscriptions
      onAddNew={() => navigate("add")}
      onEdit={(id) => navigate(`${id}/edit`)}
    />
  );
}
