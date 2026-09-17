import { createContext, useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import { getStorageItem } from "../utils/storage";

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
    // Fallback to storage so permissions survive reloads even if Redux is empty
    try {
      const raw = getStorageItem("subsync_user");
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

  const user = useSelector((state) => state.auth.user);
  const isAdmin = useMemo(() => {
    if (user?.roleKey === 'admin' || user?.role?.toLowerCase() === 'admin') return true;
    try {
      const raw = getStorageItem("subsync_user");
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.roleKey === 'admin' || parsed?.role?.toLowerCase() === 'admin') return true;
    } catch {
      // ignore JSON error
    }
    return false;
  }, [user]);

  const value = useMemo(() => {
    const normalized = new Set(permissions);
    return {
      permissions,
      hasPermission: (required) => {
        if (!required || isAdmin) return true;
        const list = Array.isArray(required) ? required : [required];
        return list.every((perm) => normalized.has(perm));
      },
      hasAnyPermission: (required) => {
        if (!required || isAdmin) return true;
        const list = Array.isArray(required) ? required : [required];
        return list.some((perm) => normalized.has(perm));
      },
      isAdmin,
    };
  }, [permissions, isAdmin]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);
