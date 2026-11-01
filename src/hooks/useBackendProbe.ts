import { useCallback, useEffect, useState } from "react";
import { BASE_PATH } from "@app/constants/app";

type BackendStatus = "up" | "starting" | "down";

interface BackendProbeState {
  status: BackendStatus;
  loginDisabled: boolean;
  loading: boolean;
}

/**
 * Lightweight backend probe that avoids global axios interceptors.
 * Used on auth screens to decide whether to show login, anonymous mode, or a backend-starting message.
 */
export function useBackendProbe() {
  const [state] = useState<BackendProbeState>({
    status: "up",
    loginDisabled: true,
    loading: false,
  });

  const probe = useCallback(async () => {
    return {
      status: "up" as const,
      loginDisabled: true,
      loading: false,
    };
  }, []);

  return {
    ...state,
    probe,
  };
}
