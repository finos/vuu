import { queryClosest } from "@finos/vuu-utils";
import {
  KeyboardEventHandler,
  MouseEventHandler,
  ReactElement,
  RefCallback,
  useCallback,
  useRef,
  useState,
} from "react";
import { CellBlock } from "./CellBlock";
import {
  CellBox,
  TableCellBlock,
  getEndCellDirection,
  getTableCellBlock,
  outsideBox,
  setElementBox,
} from "./cellblock-utils";

const Hi = Number.MAX_SAFE_INTEGER;

type RefState = {
  dragState: "pending" | "active";
  cellBlock: HTMLDivElement | null;
  cellBlockClassName: string;
  endBox: CellBox;
  endCell: HTMLDivElement | null;
  mousePosX: number;
  mousePosY: number;
  mouseStartX: number;
  mouseStartY: number;
  startCell: HTMLDivElement | null;
  startBox: CellBox;
};

const refState: RefState = {
  cellBlock: null,
  cellBlockClassName: "",
  dragState: "pending",
  endBox: { bottom: -1, left: Hi, right: -1, top: Hi },
  endCell: null,
  mousePosX: -1,
  mousePosY: -1,
  mouseStartX: -1,
  mouseStartY: -1,
  startBox: { bottom: -1, left: -1, right: -1, top: -1 },
  startCell: null,
} as const;

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
  onSelectCellBlock: (cellBlock: TableCellBlock) => void;
}

export const useCellBlockSelection = ({
  allowCellBlockSelection,
  onSelectCellBlock,
}: CellblockSelectionHookProps) => {
  const [cellBlock, setCellBlock] = useState<ReactElement | null>(null);
  const stateRef = useRef<RefState>(refState);
  const handlersRef = useRef<MouseHandlers>(mouseHandlers);

  const cellBlockRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    stateRef.current.cellBlock = el;
  }, []);

  const createCellBlock = useCallback(() => {
    setCellBlock(<CellBlock ref={cellBlockRef} />);
  }, [cellBlockRef]);

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
      startBox: { ...startBox },
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
    const { cellBlock, cellBlockClassName, endBox, startBox } =
      stateRef.current;
    if (outsideBox(startBox, x, y) && outsideBox(endBox, x, y)) {
      const cell = queryClosest<HTMLDivElement>(
        evt.target,
        ".vuuTableCell, .vuuCellBlock",
      );
      const table = queryClosest<HTMLDivElement>(cell, ".vuuTable");
      if (table) {
        table.classList.add("vuu-cellblock-select-in-progress");
      }
      if (cell?.classList.contains("vuuTableCell")) {
        setElementBox(cell, endBox);
        stateRef.current.endCell = cell;
        const endBlockDirection = getEndCellDirection(startBox, endBox);
        const newCellBlockClassName = `cellblock-direction-${endBlockDirection}`;
        if (newCellBlockClassName !== cellBlockClassName) {
          if (cellBlockClassName) {
            cellBlock?.classList.replace(
              cellBlockClassName,
              newCellBlockClassName,
            );
          } else {
            cellBlock?.classList.add(newCellBlockClassName);
          }
          stateRef.current.cellBlockClassName = newCellBlockClassName;
        }
      }
    }
  }, []);

  handlersRef.current.mouseUp = useCallback(
    (evt: MouseEvent) => {
      removeMouseListener("mouseMove");
      removeMouseListener("mouseUp");

      const { endCell, startCell } = stateRef.current;

      const table = queryClosest<HTMLDivElement>(evt.target, ".vuuTable");
      endCell?.classList.add("vuu-cellblock-end");
      if (table) {
        table.classList.remove("vuu-cellblock-select-in-progress");
      }

      if (startCell && endCell) {
        const tableCellBlock = getTableCellBlock(startCell, endCell);
        onSelectCellBlock?.(tableCellBlock);
      }
    },
    [onSelectCellBlock, removeMouseListener],
  );

  handlersRef.current.mouseMovePreDrag = useCallback(
    (evt: MouseEvent) => {
      const { current: state } = stateRef;
      const { mouseStartX, mouseStartY, startBox, startCell } = state;

      const x = (state.mousePosX = evt.clientX);
      const y = (state.mousePosY = evt.clientY);

      const distance = Math.max(
        Math.abs(x - mouseStartX),
        Math.abs(y - mouseStartY),
      );

      if (distance > DRAG_THRESHOLD) {
        if (startCell) {
          setElementBox(startCell, startBox);
          startCell.classList.add("vuu-cellblock-start");
          createCellBlock();
        }

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

  const handleMouseDown = useCallback<MouseEventHandler>(
    (evt) => {
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
      }
    },
    [addMouseListener, initializeStateRef],
  );

  const shiftingRef = useRef(false);
  const cellBlockEndRef = useRef([0, 0]);
  const nativeKeyDownHandlerRef = useRef<NativeKeyboardHandler>(NullHandler);

  const handleNativeKeyUp = useCallback((evt: KeyboardEvent) => {
    if (evt.key === "Shift") {
      const { current: pos } = cellBlockEndRef;

      if (pos[0] || pos[1]) {
        console.log(`cell selection [${pos[0]},${pos[1]}]`);
      }
      console.log("abandon cellblock selection");
      shiftingRef.current = false;

      window.removeEventListener("keydown", nativeKeyDownHandlerRef.current, {
        capture: true,
      });
      window.removeEventListener("keyup", handleNativeKeyUp, {
        capture: true,
      });
    }
  }, []);
  const handleNativeKeyDown = (nativeKeyDownHandlerRef.current = useCallback(
    (evt: KeyboardEvent) => {
      if (evt.key.startsWith("Arrow")) {
        const { current: pos } = cellBlockEndRef;
        switch (evt.key) {
          case "ArrowRight":
            pos[0] += 1;
            break;
          case "ArrowLEFT":
            pos[0] -= 1;
            break;
          case "ArrowUP":
            pos[1] -= 1;
            break;
          case "ArrowDown":
            pos[1] += 1;
            break;
        }
      }
    },
    [],
  ));
  const handleKeyDown = useCallback<KeyboardEventHandler>(
    (evt) => {
      if (evt.key === "Shift") {
        shiftingRef.current = true;

        window.addEventListener("keydown", handleNativeKeyDown, {
          capture: true,
        });
        window.addEventListener("keyup", handleNativeKeyUp, {
          capture: true,
        });

        evt.preventDefault();
      }
    },
    [handleNativeKeyDown, handleNativeKeyUp],
  );

  return {
    cellBlock,
    onKeyDown: allowCellBlockSelection ? handleKeyDown : undefined,
    onMouseDown: allowCellBlockSelection ? handleMouseDown : undefined,
  };
};
