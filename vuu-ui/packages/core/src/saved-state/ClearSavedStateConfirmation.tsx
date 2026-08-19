import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogHeader,
  StackLayout,
  Text,
} from "@salt-ds/core";
import { useRef } from "react";
import { formatList } from "./saved-state-format";
import type { ClearDescription } from "./saved-state-model";

const classBase = "vuuClearSavedStateConfirmation";

export const MAX_CONFIRMATION_LINES = 5;

export interface ClearSavedStateConfirmationProps {
  /** Clear all uses a single sentence rather than a list. */
  clearAll?: boolean;
  lines: readonly ClearDescription[];
  /** Titles of affected applications that are open. */
  openApplications: readonly string[];
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
}

/** Confirms clearing saved state (§9.6). */
export const ClearSavedStateConfirmation = ({
  clearAll = false,
  lines,
  onCancel,
  onConfirm,
  open,
  openApplications,
}: ClearSavedStateConfirmationProps) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const shown = lines.slice(0, MAX_CONFIRMATION_LINES);
  const more = lines.length - shown.length;

  return (
    <Dialog
      className={classBase}
      initialFocus={cancelRef}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
      open={open}
      size="small"
      status="warning"
    >
      <DialogHeader header="Clear saved state?" />
      <DialogContent>
        <StackLayout gap={1}>
          {clearAll ? (
            <Text>
              All saved state for all applications will be permanently removed.
            </Text>
          ) : (
            <>
              <Text>The following will be permanently removed:</Text>
              <ul className={`${classBase}-list`}>
                {shown.map(({ description, title }, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: an application can have several lines
                  <li key={index}>
                    <Text>
                      {title} — {description}
                    </Text>
                  </li>
                ))}
                {more > 0 ? (
                  <li>
                    <Text color="secondary">and {more} more</Text>
                  </li>
                ) : null}
              </ul>
            </>
          )}
          <Text>
            {openApplications.length > 0
              ? `${formatList(openApplications)} ${
                  openApplications.length === 1
                    ? "is open and will return to its default view."
                    : "are open and will return to their default view."
                } `
              : null}
            You can't undo this.
          </Text>
        </StackLayout>
      </DialogContent>
      <DialogActions>
        <Button
          appearance="bordered"
          onClick={onCancel}
          ref={cancelRef}
          sentiment="neutral"
        >
          Cancel
        </Button>
        <Button appearance="solid" onClick={onConfirm} sentiment="negative">
          Clear saved state
        </Button>
      </DialogActions>
    </Dialog>
  );
};
