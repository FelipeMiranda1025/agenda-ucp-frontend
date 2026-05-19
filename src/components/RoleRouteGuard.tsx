import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const SOPORTE_ROL_ID = 5;

/**
 * Keeps URL and role in sync: only Soporte may stay on /support;
 * Soporte is sent to /support from the main agenda routes.
 */
export function RoleRouteGuard() {
  const { user, isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const isSupport = user.rolId === SOPORTE_ROL_ID;

    if (isSupport && pathname === "/") {
      navigate("/support", { replace: true });
    } else if (!isSupport && pathname === "/support") {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user, pathname, navigate]);

  return null;
}

/** Blocks non-Soporte roles from rendering the support panel. */
export function SupportPanelGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isSupport = user?.rolId === SOPORTE_ROL_ID;

  useEffect(() => {
    if (user && !isSupport) {
      navigate("/", { replace: true });
    }
  }, [user, isSupport, navigate]);

  if (!isSupport) {
    return null;
  }

  return <>{children}</>;
}
