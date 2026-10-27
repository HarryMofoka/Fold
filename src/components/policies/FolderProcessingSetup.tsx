import type { FolderRecord } from "@app/types/folder";
import { ProcessingFolderSetupFlow } from "@app/components/policies/ProcessingFolderSetupFlow";

export interface FolderProcessingSetupProps {
  folder?: FolderRecord | null;
  onClose: () => void;
}

/** Existing-folder entry skips destination selection and preserves saved processing. */
export function FolderProcessingSetup({
  folder,
  onClose,
}: FolderProcessingSetupProps) {
  return folder ? (
    <ProcessingFolderSetupFlow
      key={folder.id}
      folder={folder}
      onClose={onClose}
    />
  ) : null;
}
