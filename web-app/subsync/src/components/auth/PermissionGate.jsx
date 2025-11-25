import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { usePermissions } from "@/context/PermissionsContext.jsx";

export const PermissionGate = ({ children, required, any, redirectTo = "/" }) => {
  const { isAuthenticated, user } = useSelector((state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    user: state.auth.user,
  }));
  const { hasPermission, hasAnyPermission } = usePermissions();
  const fallbackPath = user ? `/${user.username}/dashboard` : redirectTo;

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (required && !hasPermission(required)) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (any && !hasAnyPermission(any)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default PermissionGate;

