import { createContext, useContext, useMemo } from "react";
import { useSelector } from "react-redux";

const PermissionsContext = createContext({
  hasPermission: () => false,
  hasAnyPermission: () => false,
  permissions: [],
});

export const PermissionsProvider = ({ children }) => {
  const statePermissions = useSelector((state) => state.auth.permissions);

  const permissions = useMemo(() => {
    if (Array.isArray(statePermissions) && statePermissions.length > 0) {
      return statePermissions;
    }
    // Fallback to sessionStorage so permissions survive reloads even if Redux is empty
    try {
      const raw = sessionStorage.getItem("subsync_user");
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && Array.isArray(parsed.permissions)) {
        return parsed.permissions;
      }
    } catch {
      // ignore JSON/Storage errors and fall through to empty list
    }
    return [];
  }, [statePermissions]);

  // if (import.meta.env.DEV) {
  //   console.log("[PermissionsContext] effective permissions", {
  //     statePermissions,
  //     permissions,
  //   });
  // }

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
