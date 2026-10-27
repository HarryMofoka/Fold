import { lazy, Suspense, useCallback, useState } from "react";
export interface ProcessingFolderCreation {
  open?: () => void;
  dialog: React.ReactNode | null;
}

export const canCreateProcessingFolders = true;

const Setup = lazy(async () => {
  const module =
    await import("@app/components/policies/ProcessingFolderSetupFlow");
  return { default: module.ProcessingFolderSetupFlow };
});

/** The wizard stays inside the editor's file providers when opened from the outer navigation rail. */
export function useProcessingFolderCreation(): ProcessingFolderCreation {
  const [opened, setOpened] = useState(false);
  const open = useCallback(() => setOpened(true), []);
  const close = useCallback(() => setOpened(false), []);

  return {
    open,
    dialog: opened ? (
      <Suspense fallback={null}>
        <Setup onClose={close} />
      </Suspense>
    ) : null,
  };
}
