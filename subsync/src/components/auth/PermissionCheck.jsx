import { usePermissions } from "@/context/PermissionsContext.jsx";

const PermissionCheck = ({ required, any, children, fallback = null }) => {
  const { hasPermission, hasAnyPermission } = usePermissions();
  if (required && !hasPermission(required)) {
    return fallback;
  }
  if (any && !hasAnyPermission(any)) {
    return fallback;
  }
  return children;
};

export default PermissionCheck;

