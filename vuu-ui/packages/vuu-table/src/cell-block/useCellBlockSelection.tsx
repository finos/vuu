import type { RpcResult } from "@vuu-ui/vuu-protocol-types";
import { isArrowKey, queryClosest } from "@vuu-ui/vuu-utils";
import {
  KeyboardEventHandler,
  MouseEventHandler,
  ReactElement,
  RefCallback,
  RefObject,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  getAriaCellPos,
  getNextCellPos,
  getTableCell,
} from "../table-dom-utils";
import { CellBlock } from "./CellBlock";
import {
  PosTuple,
  RefState,
  TableCellBlock,
  getTableCellBlock,
  getTextFromCells,
  isNullCellBox,
  outsideBox,
  refState,
  setElementBox,
  updateCellBlockClassName,
} from "./cellblock-utils";

const clone = (posTuple: PosTuple) => posTuple.slice() as PosTuple;

type NativeKeyboardHandler = (evt: KeyboardEvent) => void;
type NativeMouseHandler = (evt: MouseEvent) => void;
type MouseHandlers = {
  mouseMove: NativeMouseHandler;
  mouseMovePreDrag: NativeMouseHandler;
  mouseUp: NativeMouseHandler;
  mouseUpPreDrag: NativeMouseHandler;
};

const NullHandler = () => console.error("no handler installed");
const mouseHandlers: MouseHandlers = {
  mouseMove: NullHandler,
  mouseMovePreDrag: NullHandler,
  mouseUp: NullHandler,
  mouseUpPreDrag: NullHandler,
};

type MouseOperation = keyof typeof mouseHandlers;

const mouseType = (name: string) =>
  name.startsWith("mouseMove") ? "mousemove" : "mouseup";

const DRAG_THRESHOLD = 5;

/**
 * The element under the pointer. While a drag that began in an input goes
 * on, Firefox gives that input as the target of every mouse event.
 */
const pointerTarget = ({ clientX, clientY }: MouseEvent) =>
  document.elementFromPoint(clientX, clientY);

export interface CellblockSelectionHookProps {
  allowCellBlockSelection?: boolean;
  /** True when the cell block has a cell that can be edited. */
  canEditCellBlock?: (cellBlock: TableCellBlock) => boolean;
  columnCount?: number;
  containerRef: RefObject<HTMLElement | null>;
  /** Sets every editable cell of the block to value. */
  onEditCellBlock?: (
    cellBlock: TableCellBlock,
    value: string,
  ) => Promise<RpcResult>;
  onSelectCellBlock?: (cellBlock: TableCellBlock) => void;
  rowCount?: number;
}

export const useCellBlockSelection = ({
  allowCellBlockSelection,
  canEditCellBlock,
  columnCount = 0,
  containerRef,
  onEditCellBlock,
  onSelectCellBlock,
  rowCount = 0,
}: CellblockSelectionHookProps) => {
  const [cellBlock, setCellBlock] = useState<ReactElement | null>(null);
  const stateRef = useRef<RefState>(refState);
  const handlersRef = useRef<MouseHandlers>(mouseHandlers);
  // The CellBlock element is created once per selection, so it calls the
  // latest editing callbacks through a ref.
  const editingRef = useRef({
    canEditCellBlock,
    onEditCellBlock,
    onSelectCellBlock,
  });
  editingRef.current = { canEditCellBlock, onEditCellBlock, onSelectCellBlock };

  const selectedCellBlock = useCallback(() => {
    const { endCell, startCell } = stateRef.current;
    return startCell && endCell
      ? getTableCellBlock(startCell, endCell)
      : undefined;
  }, []);

  const canEdit = useCallback(() => {
    const cellBlock = selectedCellBlock();
    return (
      cellBlock !== undefined &&
      editingRef.current.canEditCellBlock?.(cellBlock) === true
    );
  }, [selectedCellBlock]);

  const handleEdit = useCallback(
    async (value: string): Promise<RpcResult> => {
      const cellBlock = selectedCellBlock();
      const { onEditCellBlock } = editingRef.current;
      return cellBlock && onEditCellBlock
        ? onEditCellBlock(cellBlock, value)
        : { errorMessage: "No cells to edit", type: "ERROR_RESULT" };
    },
    [selectedCellBlock],
  );

  const handleCopy = useCallback(async () => {
    const { startCell, endCell } = stateRef.current;
    if (startCell && endCell) {
      const tsvText = getTextFromCells(startCell, endCell);
      const type = "text/plain";
      const blob = new Blob([tsvText], { type });
      const data = [new ClipboardItem({ [type]: blob })];
      await navigator.clipboard.write(data);
    }
  }, []);

  const cellBlockRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    const { current: state } = stateRef;
    state.cellBlock = el;
    // the selection may have grown before the block was rendered
    if (el && state.cellBlockClassName) {
      el.classList.add(state.cellBlockClassName);
    }
  }, []);

  const initializeStateRef = useCallback(() => {
    const { cellBlock, cellBlockClassName, startCell, endCell } =
      stateRef.current;
    if (startCell) {
      startCell.classList.remove("vuu-cellblock-start");
    }
    if (endCell) {
      endCell.classList.remove("vuu-cellblock-end");
    }
    if (cellBlock?.classList.contains(cellBlockClassName)) {
      cellBlock.classList.remove(cellBlockClassName);
    }

    const { endBox, startBox } = refState;

    stateRef.current = {
      ...refState,
      cellBlock,
      endBox: { ...endBox },
      endPos: [-1, -1],
      startBox: { ...startBox },
      startPos: [-1, -1],
    };
  }, []);

  const clearCellBlock = useCallback(() => {
    initializeStateRef();
    setCellBlock(null);
  }, [initializeStateRef]);

  const createCellBlock = useCallback(
    (method: "mouse" | "keyboard" = "mouse") => {
      const { startBox, startCell } = stateRef.current;
      if (startCell) {
        const table = queryClosest<HTMLDivElement>(startCell, ".vuuTable");
        if (table) {
          table.classList.add(`vuu-cellblock-select-in-progress-${method}`);
        }
        setElementBox(startCell, startBox);
        startCell.classList.add("vuu-cellblock-start");
        setCellBlock(
          <CellBlock
            canEdit={canEdit}
            onCopy={handleCopy}
            onDismiss={clearCellBlock}
            onEdit={handleEdit}
            ref={cellBlockRef}
          />,
        );
      }
    },
    [canEdit, cellBlockRef, clearCellBlock, handleCopy, handleEdit],
  );

  const addMouseListener = useCallback(
    (mouseOperation: MouseOperation, handler: NativeMouseHandler) => {
      window.addEventListener(mouseType(mouseOperation), handler);
      handlersRef.current[mouseOperation] = handler;
    },
    [],
  );

  const removeMouseListener = useCallback((name: MouseOperation) => {
    window.removeEventListener(mouseType(name), handlersRef.current[name]);
  }, []);

  handlersRef.current.mouseMove = useCallback((evt: MouseEvent) => {
    const { clientX: x, clientY: y } = evt;
    const { endBox, startBox } = stateRef.current;
    if (outsideBox(startBox, x, y) && outsideBox(endBox, x, y)) {
      const cell = queryClosest<HTMLDivElement>(
        pointerTarget(evt),
        ".vuuTableCell, .vuuCellBlock",
      );
      if (cell?.classList.contains("vuuTableCell")) {
        setElementBox(cell, endBox);
        stateRef.current.endCell = cell;
        updateCellBlockClassName(stateRef.current);
      }
    }
  }, []);

  handlersRef.current.mouseUp = useCallback(
    (evt: MouseEvent) => {
      removeMouseListener("mouseMove");
      removeMouseListener("mouseUp");

      const { cellBlock, endCell, startCell } = stateRef.current;

      const table = queryClosest<HTMLDivElement>(evt.target, ".vuuTable");
      endCell?.classList.add("vuu-cellblock-end");
      if (table) {
        table.classList.remove("vuu-cellblock-select-in-progress-mouse");
      }

      if (startCell && endCell) {
        const tableCellBlock = getTableCellBlock(startCell, endCell);
        onSelectCellBlock?.(tableCellBlock);
      }

      if (cellBlock) {
        cellBlock.focus();
      }
    },
    [onSelectCellBlock, removeMouseListener],
  );

  handlersRef.current.mouseMovePreDrag = useCallback(
    (evt: MouseEvent) => {
      const { current: state } = stateRef;
      const { mouseStartX, mouseStartY } = state;

      const x = (state.mousePosX = evt.clientX);
      const y = (state.mousePosY = evt.clientY);

      const distance = Math.max(
        Math.abs(x - mouseStartX),
        Math.abs(y - mouseStartY),
      );

      if (distance > DRAG_THRESHOLD) {
        createCellBlock("mouse");

        const { mouseMove, mouseUp } = handlersRef.current;
        removeMouseListener("mouseMovePreDrag");
        removeMouseListener("mouseUpPreDrag");
        addMouseListener("mouseMove", mouseMove);
        addMouseListener("mouseUp", mouseUp);
      }
    },
    [addMouseListener, createCellBlock, removeMouseListener],
  );

  handlersRef.current.mouseUpPreDrag = useCallback(() => {
    removeMouseListener("mouseMovePreDrag");
    removeMouseListener("mouseUpPreDrag");
  }, [removeMouseListener]);

  const handleNativeMouseOver = useCallback((evt: MouseEvent) => {
    const cell = queryClosest<HTMLDivElement>(
      pointerTarget(evt),
      ".vuuTableCell",
    );
    if (cell) {
      stateRef.current.endPos = getAriaCellPos(cell);
      stateRef.current.endCell?.classList.remove("vuu-cellblock-end");
      stateRef.current.endCell = cell;
      setElementBox(cell, stateRef.current.endBox);
      updateCellBlockClassName(stateRef.current);

      cell?.classList.add("vuu-cellblock-end");
    }
  }, []);

  const handleNativeMouseUp = useCallback(() => {
    window.removeEventListener("mouseover", handleNativeMouseOver);
  }, [handleNativeMouseOver]);

  const handleMouseDown = useCallback<MouseEventHandler>(
    (evt) => {
      // a press on the block is for the block
      if (evt.button === 0 && !queryClosest(evt.target, ".vuuCellBlock")) {
        clearCellBlock();
        const { current: state } = stateRef;
        const cell = queryClosest<HTMLDivElement>(evt.target, ".vuuTableCell");
        if (cell) {
          state.startCell = cell;
          state.mouseStartX = evt.clientX;
          state.mouseStartY = evt.clientY;

          const { mouseMovePreDrag, mouseUpPreDrag } = handlersRef.current;
          addMouseListener("mouseMovePreDrag", mouseMovePreDrag);
          addMouseListener("mouseUpPreDrag", mouseUpPreDrag);
          console.log("register mouse enter");
          window.addEventListener("mouseover", handleNativeMouseOver);
          window.addEventListener("mouseup", handleNativeMouseUp);
        }
      }
    },
    [
      addMouseListener,
      clearCellBlock,
      handleNativeMouseOver,
      handleNativeMouseUp,
    ],
  );

  const nativeKeyDownHandlerRef = useRef<NativeKeyboardHandler>(NullHandler);

  const handleNativeKeyUp = useCallback(
    (evt: KeyboardEvent) => {
      if (evt.key === "Shift") {
        const { cellBlock, endCell, startCell } = stateRef.current;
        const table = queryClosest<HTMLDivElement>(evt.target, ".vuuTable");
        endCell?.classList.add("vuu-cellblock-end");
        if (table) {
          table.classList.remove("vuu-cellblock-select-in-progress-keyboard");
        }

        window.removeEventListener(
          "keydown",
          nativeKeyDownHandlerRef.current,
          {
            capture: true,
          },
        );
        window.removeEventListener("keyup", handleNativeKeyUp, {
          capture: true,
        });

        // a block of more than one cell was selected
        if (startCell && endCell && startCell !== endCell) {
          editingRef.current.onSelectCellBlock?.(
            getTableCellBlock(startCell, endCell),
          );
          cellBlock?.focus();
        }
      }
    },
    [],
  );

  const handleNativeKeyDown = (nativeKeyDownHandlerRef.current = useCallback(
    ({ key }: KeyboardEvent) => {
      if (isArrowKey(key)) {
        const { endBox, endPos, startBox } = stateRef.current;
        if (isNullCellBox(startBox)) {
          createCellBlock("keyboard");
        }
        const nextCell = getNextCellPos(key, endPos, columnCount, rowCount);
        stateRef.current.endPos = nextCell;
        const cell = getTableCell(containerRef, nextCell);
        stateRef.current.endCell = cell as HTMLDivElement;
        setElementBox(cell, endBox);
        updateCellBlockClassName(stateRef.current);
      }
    },
    [columnCount, containerRef, createCellBlock, rowCount],
  ));
  const handleKeyDown = useCallback<KeyboardEventHandler>(
    (evt) => {
      console.log(
        `[useCellBlockSelection] handleKeyDown (only interested in Shift key)`,
      );
      if (evt.key === "Shift") {
        // Shift pressed on the block itself is for typing in it
        const cell = queryClosest<HTMLDivElement>(evt.target, ".vuuTableCell");
        if (cell) {
          initializeStateRef();
          const startPos = getAriaCellPos(cell);
          stateRef.current.startPos = startPos;
          stateRef.current.endPos = clone(startPos);
          const { current: state } = stateRef;
          state.startCell = cell;

          window.addEventListener("keydown", handleNativeKeyDown, {
            capture: true,
          });
          window.addEventListener("keyup", handleNativeKeyUp, {
            capture: true,
          });

          evt.preventDefault();
        }
      }
    },
    [handleNativeKeyDown, handleNativeKeyUp, initializeStateRef],
  );

  return {
    cellBlock,
    onKeyDown: allowCellBlockSelection ? handleKeyDown : undefined,
    onMouseDown: allowCellBlockSelection ? handleMouseDown : undefined,
  };
};
