import { Input } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type { RpcResult } from "@vuu-ui/vuu-protocol-types";
import { isArrowKey, isCharacterKey, isRpcError } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  type HTMLAttributes,
  type KeyboardEvent,
  type KeyboardEventHandler,
  type MouseEventHandler,
  forwardRef,
  useCallback,
  useState,
} from "react";

import cellBlockCss from "./CellBlock.css";

const classBase = "vuuCellBlock";

export interface CellBlockProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onCopy"> {
  /** True when the block has a cell that can be edited. */
  canEdit?: () => boolean;
  debugName?: string;
  onCopy?: () => void;
  /** Called when an arrow key moves away from the block. */
  onDismiss?: () => void;
  /** Sets every editable cell of the block to value. */
  onEdit?: (value: string) => Promise<RpcResult>;
}

type EditorState = { error?: string; value: string };

/**
 * The selected block of cells. Copy copies its cells as tab separated text.
 * When its cells can be edited, typing opens an editor in the block, and
 * Enter sets every editable cell to the value typed, as one change.
 */
export const CellBlock = forwardRef<HTMLDivElement, CellBlockProps>(
  function CellBlock(
    { canEdit, className, onCopy, onDismiss, onEdit, ...htmlAttributes },
    forwardedRef,
  ) {
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "vuu-cell-block",
      css: cellBlockCss,
      window: targetWindow,
    });
    const [editor, setEditor] = useState<EditorState | undefined>();

    /** Resolves to true when every cell was edited. */
    const edit = useCallback(
      async (value: string) => {
        const response = await onEdit?.(value);
        if (response && isRpcError(response)) {
          setEditor({ error: response.errorMessage, value });
          return false;
        }
        setEditor(undefined);
        return true;
      },
      [onEdit],
    );

    const handleKeyDown = useCallback<KeyboardEventHandler>(
      async (evt) => {
        if (evt.metaKey && evt.key === "c") {
          onCopy?.();
        } else if (editor === undefined && isArrowKey(evt.key)) {
          // the table moves the focused cell; the block goes
          if (!evt.shiftKey) onDismiss?.();
        } else if (editor === undefined && canEdit?.()) {
          // a key that opens the editor is not for the table's focused cell
          if (
            isCharacterKey(evt.key) &&
            !evt.ctrlKey &&
            !evt.metaKey &&
            !evt.altKey
          ) {
            evt.preventDefault();
            evt.stopPropagation();
            setEditor({ value: evt.key });
          }
        }
      },
      [canEdit, editor, onCopy, onDismiss],
    );

    const handleEditorKeyDown = useCallback(
      (evt: KeyboardEvent<HTMLInputElement>) => {
        // keys typed in the editor are for the editor, not the table
        evt.stopPropagation();
        if (evt.key === "Enter") {
          const cellBlock = evt.currentTarget.closest<HTMLElement>(
            `.${classBase}`,
          );
          edit(evt.currentTarget.value).then((edited) => {
            if (edited) cellBlock?.focus();
          });
        } else if (evt.key === "Escape") {
          setEditor(undefined);
          (evt.currentTarget.closest(`.${classBase}`) as HTMLElement)?.focus();
        }
      },
      [edit],
    );

    const onContextMenu = useCallback<MouseEventHandler>(() => {
      console.log("on cvontext menu");
    }, []);

    return (
      <div
        {...htmlAttributes}
        className={cx(classBase, className)}
        ref={forwardedRef}
        onContextMenu={onContextMenu}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {editor ? (
          <Input
            bordered
            className={`${classBase}-editor`}
            inputProps={{
              "aria-label": "Value for the selected cells",
              autoFocus: true,
              onKeyDown: handleEditorKeyDown,
              title: editor.error,
            }}
            onChange={(evt) =>
              setEditor({ value: (evt.target as HTMLInputElement).value })
            }
            validationStatus={editor.error ? "error" : undefined}
            value={editor.value}
          />
        ) : null}
      </div>
    );
  },
);
