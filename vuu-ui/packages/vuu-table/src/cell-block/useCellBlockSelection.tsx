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

export interface CellblockSelectionHookProps {
  allowCellBlockSelection?: boolean;
  columnCount?: number;
  containerRef: RefObject<HTMLElement | null>;
  onSelectCellBlock?: (cellBlock: TableCellBlock) => void;
  rowCount?: number;
}

export const useCellBlockSelection = ({
  allowCellBlockSelection,
  columnCount = 0,
  containerRef,
  onSelectCellBlock,
  rowCount = 0,
}: CellblockSelectionHookProps) => {
  const [cellBlock, setCellBlock] = useState<ReactElement | null>(null);
  const stateRef = useRef<RefState>(refState);
  const handlersRef = useRef<MouseHandlers>(mouseHandlers);

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
    stateRef.current.cellBlock = el;
  }, []);

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
        setCellBlock(<CellBlock onCopy={handleCopy} ref={cellBlockRef} />);
      }
    },
    [cellBlockRef, handleCopy],
  );

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
        evt.target,
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
    const cell = queryClosest<HTMLDivElement>(evt.target, ".vuuTableCell");
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
      if (evt.button === 0) {
        initializeStateRef();
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
      handleNativeMouseOver,
      handleNativeMouseUp,
      initializeStateRef,
    ],
  );

  const nativeKeyDownHandlerRef = useRef<NativeKeyboardHandler>(NullHandler);

  const handleNativeKeyUp = useCallback((evt: KeyboardEvent) => {
    if (evt.key === "Shift") {
      const { endCell } = stateRef.current;
      const table = queryClosest<HTMLDivElement>(evt.target, ".vuuTable");
      endCell?.classList.add("vuu-cellblock-end");
      if (table) {
        table.classList.remove("vuu-cellblock-select-in-progress-keyboard");
      }

      window.removeEventListener("keydown", nativeKeyDownHandlerRef.current, {
        capture: true,
      });
      window.removeEventListener("keyup", handleNativeKeyUp, {
        capture: true,
      });
    }
  }, []);

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
        initializeStateRef();
        const cell = queryClosest<HTMLDivElement>(evt.target, ".vuuTableCell");
        if (cell) {
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
