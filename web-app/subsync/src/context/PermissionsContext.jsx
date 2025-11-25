import { createContext, useContext, useMemo } from "react";
import { useSelector } from "react-redux";

const PermissionsContext = createContext({
  hasPermission: () => false,
  hasAnyPermission: () => false,
  permissions: [],
});

export const PermissionsProvider = ({ children }) => {
  const permissions = useSelector((state) => state.auth.permissions || []);

  const value = useMemo(() => {
    const normalized = new Set(permissions);
    return {
      permissions,
      hasPermission: (required) => {
        if (!required) return true;
        const list = Array.isArray(required) ? required : [required];
        return list.every((perm) => normalized.has(perm));
      },
      hasAnyPermission: (required) => {
        if (!required) return true;
        const list = Array.isArray(required) ? required : [required];
        return list.some((perm) => normalized.has(perm));
      },
    };
  }, [permissions]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);

