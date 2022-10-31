import React, {
  MutableRefObject,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  LayoutActionType,
  layoutFromJson,
  LayoutJSON,
  layoutReducer,
  LayoutReducerAction,
  layoutToJSON,
  processLayoutElement,
} from "../layout-reducer";
import { findTarget, getChildProp, getProps, typeOf } from "../utils";
import {
  LayoutProviderContext,
  LayoutProviderDispatch,
} from "./LayoutProviderContext";
import { useLayoutDragDrop } from "./useLayoutDragDrop";

const withDropTarget = (props: any) => props.dropTarget;
const shouldSave = (action: LayoutReducerAction) =>
  [
    "drag-drop",
    "remove",
    "set-title",
    "splitter-resize",
    "switch-tab",
  ].includes(action.type);

type LayoutChangeHandler = (layout: LayoutJSON, source: string) => void;

export interface LayoutProviderProps {
  children: ReactElement;
  layout?: LayoutJSON;
  onLayoutChange?: LayoutChangeHandler;
}

export const LayoutProviderVersion = () => {
  const version = useLayoutProviderVersion();
  return <div>{`Context: ${version} `}</div>;
};

export const LayoutProvider = (props: LayoutProviderProps): ReactElement => {
  const { children, layout, onLayoutChange } = props;
  const state = useRef<ReactElement | undefined>(undefined);
  const childrenRef = useRef<ReactElement>(children);

  const [, forceRefresh] = useState<any>(null);

  const dispatchLayoutAction = useCallback(
    (action: LayoutReducerAction, suppressSave = false) => {
      const nextState = layoutReducer(state.current as ReactElement, action);
      if (nextState !== state.current) {
        state.current = nextState;
        forceRefresh({});
        if (!suppressSave && shouldSave(action)) {
          serializeState(nextState);
        }
      }
    },
    [forceRefresh]
  );

  const serializeState = useCallback(
    (source) => {
      if (onLayoutChange) {
        const targetContainer =
          findTarget(source, withDropTarget) || state.current;
        const isDraggableLayout = typeOf(targetContainer) === "DraggableLayout";
        const target = isDraggableLayout
          ? getProps(targetContainer).children[0]
          : targetContainer;
        const serializedModel = layoutToJSON(target);
        onLayoutChange(serializedModel, "drag-root");
      }
    },
    [onLayoutChange]
  );

  const layoutActionDispatcher: LayoutProviderDispatch = useCallback(
    (action) => {
      // onsole.log(
      //   `%cdispatchLayoutProviderAction ${action.type}`,
      //   "color: blue; font-weight: bold;"
      // );

      if (action.type === "drag-start") {
        prepareToDragLayout(action);
      } else if (action.type === "save") {
        serializeState(state.current);
      } else if (state.current) {
        dispatchLayoutAction(action);
      }
    },
    []
  );

  useEffect(() => {
    if (layout) {
      const targetContainer = findTarget(
        state.current as any,
        withDropTarget
      ) as ReactElement;
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
    }
  }, [layout]);

  if (state.current === undefined) {
    state.current = processLayoutElement(children);
  } else if (children !== childrenRef.current) {
    state.current = processLayoutElement(children, state.current);
    childrenRef.current = children;
  }

  const prepareToDragLayout = useLayoutDragDrop(
    state as MutableRefObject<ReactElement>,
    layoutActionDispatcher
  );

  return (
    <LayoutProviderContext.Provider
      value={{ dispatchLayoutProvider: layoutActionDispatcher, version: 0 }}
    >
      {state.current}
    </LayoutProviderContext.Provider>
  );
};

export const useLayoutProviderDispatch = () => {
  const { dispatchLayoutProvider } = useContext(LayoutProviderContext);
  return dispatchLayoutProvider;
};

export const useLayoutProviderVersion = () => {
  console.log({ LayoutProviderContext });
  const { version } = useContext(LayoutProviderContext);
  return version;
};
