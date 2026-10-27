import { useAuth } from "@app/auth/context";

export interface PortalAccessState {
  granted: boolean;
  settled: boolean;
}

/**
 * Self-hosted (and desktop): the Spring session carries `portalAccess`, so the
 * shared auth context is both the answer and the settled signal.
 */
export function usePortalAccessState(): PortalAccessState {
  const { portalAccess, loading } = useAuth();
  return { granted: portalAccess === true, settled: !loading };
}

export function usePortalAccess(): boolean {
  return usePortalAccessState().granted;
}
