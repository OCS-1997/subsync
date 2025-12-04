import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { usePermissions } from "@/context/PermissionsContext.jsx";

export const PermissionGate = ({ children, required, any, redirectTo = "/" }) => {
  const location = useLocation();
  const reduxIsAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const reduxUser = useSelector((state) => state.auth.user);
  const { permissions, hasPermission, hasAnyPermission } = usePermissions();

  // Fallback to sessionStorage so guards keep working even if Redux state is lost
  let sessionUser = null;
  try {
    const raw = sessionStorage.getItem("subsync_user");
    sessionUser = raw ? JSON.parse(raw) : null;
  } catch {
    sessionUser = null;
  }

  const isAuthenticated = reduxIsAuthenticated || !!sessionUser;
  const user = reduxUser || sessionUser;
  const fallbackPath = user ? `/${user.username}/dashboard` : redirectTo;

  // if (import.meta.env.DEV) {
  //   console.log("[PermissionGate]", {
  //     path: location.pathname,
  //     required,
  //     any,
  //     isAuthenticated,
  //     reduxIsAuthenticated,
  //     user,
  //     permissions,
  //     hasRequired: required ? hasPermission(required) : undefined,
  //     hasAny: any ? hasAnyPermission(any) : undefined,
  //     fallbackPath,
  //   });
  // }

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
