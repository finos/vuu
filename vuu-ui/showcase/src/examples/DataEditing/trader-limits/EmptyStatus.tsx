import { Button, StackLayout, Text } from "@salt-ds/core";
import { Icon } from "@vuu-ui/vuu-ui-controls";

export interface EmptyStatusProps {
  onDownloadTemplate: () => void;
  onImport: () => void;
}

/**
 * Shown in the table body when there are no limits.
 */
export const EmptyStatus = ({
  onDownloadTemplate,
  onImport,
}: EmptyStatusProps) => (
  <StackLayout
    align="center"
    className="TraderLimits-emptyStatus"
    data-testid="empty-status"
    gap={2}
  >
    <Icon name="box" size={32} />
    <Text styleAs="h3">No limits</Text>
    <Text>
      Download the template, fill it in and import it, or switch to Edit to
      enter limits manually.
    </Text>
    <StackLayout direction="row" gap={1}>
      <Button onClick={onDownloadTemplate}>Download</Button>
      <Button appearance="solid" sentiment="accented" onClick={onImport}>
        Import
      </Button>
    </StackLayout>
  </StackLayout>
);
