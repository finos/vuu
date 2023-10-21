import {
  MutableRefObject,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LayoutActionType,
  LayoutChangeHandler,
  LayoutChangeReason,
  layoutFromJson,
  LayoutJSON,
  layoutReducer,
  LayoutReducerAction,
  layoutToJSON,
  processLayoutElement,
  SaveAction,
} from "../layout-reducer";
import { findTarget, getChildProp, getProp, getProps, typeOf } from "../utils";
import {
  LayoutProviderContext,
  LayoutProviderDispatch,
} from "./LayoutProviderContext";
import { useLayoutDragDrop } from "./useLayoutDragDrop";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withDropTarget = (props: any) => props.dropTarget;
const shouldSave = (action: LayoutReducerAction) =>
  [
    "drag-drop",
    "remove",
    "set-title",
    "splitter-resize",
    "switch-tab",
  ].includes(action.type);

const getLayoutChangeReason = (
  action: LayoutReducerAction | SaveAction
): LayoutChangeReason => {
  switch (action.type) {
    case "switch-tab":
      // TODO how can we make this more robust, shouldn't rely on 'main-tabs'
      if (action.id === "main-tabs") {
        return "switch-active-layout";
      } else {
        return "switch-active-tab";
      }
    case "save":
      return "save-feature-props";
    case "drag-drop":
      return "drag-drop-operation";
    case "remove":
      return "remove-component";
    case "splitter-resize":
      return "resize-component";
    case "set-title":
      return "edit-feature-title";
    default:
      throw Error("unknown layout action");
  }
};

export interface LayoutProviderProps {
  children: ReactElement;
  createNewChild?: (index?: number) => ReactElement;
  pathToDropTarget?: string;
  layout?: LayoutJSON;
  onLayoutChange?: LayoutChangeHandler;
}

export const LayoutProviderVersion = () => {
  const version = useLayoutProviderVersion();
  return <div>{`Context: ${version} `}</div>;
};

export const LayoutProvider = (props: LayoutProviderProps): ReactElement => {
  const { children, createNewChild, pathToDropTarget, layout, onLayoutChange } =
    props;
  const state = useRef<ReactElement | undefined>(undefined);
  const childrenRef = useRef<ReactElement>(children);

  const [, forceRefresh] = useState<unknown>(null);

  const serializeState = useCallback(
    (source, layoutChangeReason: LayoutChangeReason) => {
      console.log(`serialize state ${layoutChangeReason}`);
      if (onLayoutChange) {
        const targetContainer =
          findTarget(source, withDropTarget) || state.current;
        const isDraggableLayout = typeOf(targetContainer) === "DraggableLayout";
        const target = isDraggableLayout
          ? getProps(targetContainer).children[0]
          : targetContainer;
        const serializedModel = layoutToJSON(target);
        onLayoutChange(serializedModel, layoutChangeReason);
      }
    },
    [onLayoutChange]
  );

  const dispatchLayoutAction = useCallback(
    (action: LayoutReducerAction, suppressSave = false) => {
      console.log(
        `%cdispatchLayoutAction ${action.type}`,
        "color:blue;font-weight:bold"
      );
      const nextState = layoutReducer(state.current as ReactElement, action);
      if (nextState !== state.current) {
        console.log({ nextState });
        state.current = nextState;
        forceRefresh({});
        if (!suppressSave && shouldSave(action)) {
          console.log(`persist this layout change`);
          serializeState(nextState, getLayoutChangeReason(action));
        } else {
          console.log("do not persist this layout change");
        }
      }
    },
    [forceRefresh, serializeState]
  );

  const layoutActionDispatcher = useCallback<LayoutProviderDispatch>(
    (action) => {
      console.log(`dispatch layout action ${action.type}`);
      switch (action.type) {
        case "drag-start": {
          prepareToDragLayout(action);
          break;
        }
        case "save": {
          serializeState(state.current, getLayoutChangeReason(action));
          break;
        }
        default: {
          dispatchLayoutAction(action);
          break;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatchLayoutAction, serializeState]
  );

  const prepareToDragLayout = useLayoutDragDrop(
    state as MutableRefObject<ReactElement>,
    layoutActionDispatcher,
    pathToDropTarget
  );

  useMemo(() => {
    console.log("layout has changed", {
      layout,
    });
  }, [layout]);

  useEffect(() => {
    if (layout) {
      const targetContainer = findTarget(
        state.current as never,
        withDropTarget
      ) as ReactElement;
      if (targetContainer) {
        const target = getChildProp(targetContainer);
        const newLayout = layoutFromJson(
          layout,
          `${targetContainer.props.path}.0`
        );
        const action = target
          ? {
              type: LayoutActionType.REPLACE,
              target,
              replacement: newLayout,
            }
          : {
              type: LayoutActionType.ADD,
              path: targetContainer.props.path,
              component: newLayout,
            };
        dispatchLayoutAction(action, true);
      } else if (layout.id === getProp(state.current, "id")) {
        const newLayout = layoutFromJson(layout, "0");
        const action = {
          type: LayoutActionType.REPLACE,
          target: state.current,
          replacement: newLayout,
        };
        dispatchLayoutAction(action, true);
      }
    }
  }, [dispatchLayoutAction, layout]);

  if (state.current === undefined) {
    state.current = processLayoutElement(children);
  } else if (children !== childrenRef.current) {
    console.log(`children have changed`);
    state.current = processLayoutElement(children, state.current);
    childrenRef.current = children;
  }

  return (
    <LayoutProviderContext.Provider
      value={{
        createNewChild,
        dispatchLayoutProvider: layoutActionDispatcher,
        version: 0,
      }}
    >
      {state.current}
    </LayoutProviderContext.Provider>
  );
};

export const useLayoutProviderDispatch = () => {
  const { dispatchLayoutProvider } = useContext(LayoutProviderContext);
  return dispatchLayoutProvider;
};

export const useLayoutCreateNewChild = () => {
  const { createNewChild } = useContext(LayoutProviderContext);
  return createNewChild;
};

export const useLayoutProviderVersion = () => {
  const { version } = useContext(LayoutProviderContext);
  return version;
};
