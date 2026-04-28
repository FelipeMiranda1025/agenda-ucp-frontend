// Centralized lazy-route prefetcher.
// Each entry returns the dynamic import promise. Browsers/webpack cache the
// chunk after the first call, so subsequent navigations are instant.
const loaders = {
  index: () => import("@/pages/Index"),
  profile: () => import("@/pages/Profile"),
  schedule: () => import("@/pages/ScheduleBuilder"),
  audit: () => import("@/pages/AuditLog"),
  dashboard: () => import("@/pages/Dashboard"),
  history: () => import("@/pages/HistoryPanel"),
  support: () => import("@/pages/SupportPanel"),
} as const;

export type RouteKey = keyof typeof loaders;

const triggered = new Set<RouteKey>();

/** Prefetch a route chunk. Safe to call repeatedly — runs at most once per route. */
export const prefetchRoute = (key: RouteKey) => {
  if (triggered.has(key)) return;
  triggered.add(key);
  // Fire and forget; ignore failures (network offline, etc.)
  loaders[key]().catch(() => triggered.delete(key));
};

/** Warm up the most frequently visited routes once the app is idle. */
export const warmupCommonRoutes = () => {
  const run = () => {
    prefetchRoute("profile");
    prefetchRoute("schedule");
  };
  if (typeof window === "undefined") return;
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback;
  if (typeof ric === "function") {
    ric(run, { timeout: 2000 });
  } else {
    setTimeout(run, 1500);
  }
};
