import { useTranslation } from "react-i18next";
import { Tooltip } from "@mantine/core";
import { ActionIcon } from "@app/ui/ActionIcon";
import { Icon } from "@app/ui/Icon";
import { Logo } from "@app/ui/Logo";

export interface SidebarHeaderProps {
  className?: string;
  onExit?: () => void;
}

/** The wordmark; the brand mark sits in the rail beside it. */
export function SidebarHeader({ className, onExit }: SidebarHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className={`file-sidebar-header${className ? ` ${className}` : ""}`}>
      <Logo variant="textOnly" textHeight="1.3rem" />
      {onExit && (
        <Tooltip
          label={t("common.exitEditor", "Exit editor")}
          position="bottom"
          withinPortal
        >
          <ActionIcon
            variant="tertiary"
            size="sm"
            className="file-sidebar-collapse-toggle"
            aria-label={t("common.exitEditor", "Exit editor")}
            onClick={onExit}
            data-testid="exit-editor-button"
          >
            <Icon name="log-out" size="1.05rem" />
          </ActionIcon>
        </Tooltip>
      )}
    </div>
  );
}

