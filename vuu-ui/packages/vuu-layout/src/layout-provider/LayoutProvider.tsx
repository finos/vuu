import { useWorkspace } from "@finos/vuu-shell";
import { VuuShellLocation, logger, type LayoutJSON } from "@finos/vuu-utils";
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
  LayoutProps,
  cloneElementAddLayoutProps,
  layoutFromJson,
  layoutQuery,
  layoutReducer,
  layoutToJSON,
  type LayoutChangeHandler,
  type LayoutChangeReason,
  type LayoutReducerAction,
} from "../layout-reducer";
import type { SaveAction } from "../layout-view";
import { findTarget, getChildProp, getProp, getProps, typeOf } from "../utils";
import {
  LayoutProviderContext,
  LayoutProviderDispatch,
} from "./LayoutProviderContext";
import { useLayoutDragDrop } from "./useLayoutDragDrop";

const { info } = logger("LayoutProvider");

const isWorkspaceContainer = (props: LayoutProps) =>
  props.id === VuuShellLocation.WorkspaceContainer;

const shouldSave = (action: LayoutReducerAction) =>
  [
    "add",
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
      if (action.id === VuuShellLocation.Workspace) {
        return "switch-active-layout";
      } else {
        return "switch-active-tab";
      }
    case "save":
      return "save-feature-props";
    case "drag-drop":
      return "drag-drop-operation";
    case "add":
      return "add-component";
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
  workspaceJSON?: LayoutJSON;
  onLayoutChange?: LayoutChangeHandler;
}

export const LayoutProviderVersion = () => {
  const version = useLayoutProviderVersion();
  return <div>{`Context: ${version} `}</div>;
};

const pathToDropTarget = `#${VuuShellLocation.Workspace}.ACTIVE_CHILD`;

export const LayoutProvider = (props: LayoutProviderProps): ReactElement => {
  const { children, createNewChild, workspaceJSON, onLayoutChange } = props;
  const state = useRef<ReactElement | undefined>(undefined);
  const childrenRef = useRef<ReactElement>(children);

  const [, forceRefresh] = useState<unknown>(null);

  const serializeState = useCallback(
    (source, layoutChangeReason: LayoutChangeReason) => {
      if (onLayoutChange) {
        const workspaceContainer =
          findTarget(source, isWorkspaceContainer) || state.current;
        const isLayoutContainer =
          typeOf(workspaceContainer) === "LayoutContainer";
        const target = isLayoutContainer
          ? getProps(workspaceContainer).children[0]
          : workspaceContainer;
        const serializedModel = layoutToJSON(target);
        onLayoutChange(serializedModel, layoutChangeReason);
      }
    },
    [onLayoutChange]
  );

  const dispatchLayoutAction = useCallback(
    (action: LayoutReducerAction, suppressSave = false) => {
      const nextState = layoutReducer(state.current as ReactElement, action);
      if (nextState !== state.current) {
        state.current = nextState;
        forceRefresh({});
        if (!suppressSave && shouldSave(action)) {
          serializeState(nextState, getLayoutChangeReason(action));
        }
      }
    },
    [forceRefresh, serializeState]
  );

  const layoutActionDispatcher = useCallback<LayoutProviderDispatch>(
    (action) => {
      switch (action.type) {
        case "drag-start": {
          prepareToDragLayout(action);
          break;
        }
        case "save": {
          serializeState(state.current, getLayoutChangeReason(action));
          break;
        }
        case "query":
          if (action.query === "PARENT_CONTAINER") {
            return layoutQuery(action.query, action.path, state.current);
          }
          break;

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

  useEffect(() => {
    if (workspaceJSON) {
      info?.("workspaceJSON changed. inject new layout into application");
      const targetContainer = findTarget(
        state.current,
        isWorkspaceContainer
      ) as ReactElement;
      if (targetContainer) {
        const target = getChildProp(targetContainer);
        const newLayout = layoutFromJson(
          workspaceJSON,
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
      } else if (workspaceJSON.id === getProp(state.current, "id")) {
        const newLayout = layoutFromJson(workspaceJSON, "0");
        const action = {
          type: LayoutActionType.REPLACE,
          target: state.current,
          replacement: newLayout,
        };
        dispatchLayoutAction(action, true);
      }
    }
  }, [dispatchLayoutAction, workspaceJSON]);

  if (state.current === undefined) {
    state.current = cloneElementAddLayoutProps(children);
  } else if (children !== childrenRef.current) {
    state.current = cloneElementAddLayoutProps(children, state.current);
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
  const { layoutPlaceholderJSON } = useWorkspace();
  const { createNewChild } = useContext(LayoutProviderContext);

  const defaultCreateNewChild = useMemo(
    () =>
      function createNewChild() {
        if (layoutPlaceholderJSON) {
          return layoutFromJson(
            {
              ...layoutPlaceholderJSON,
              props: {
                resizeable: true,
                style: {
                  ...layoutPlaceholderJSON?.props?.style,
                  flexGrow: 1,
                  flexShrink: 0,
                  flexBasis: 0,
                },
              },
            },
            "0"
          );
        }
        return layoutFromJson(
          {
            type: "Placeholder",
            props: {
              resizeable: true,
              style: {
                flexGrow: 1,
                flexShrink: 0,
                flexBasis: 0,
              },
            },
          },
          "0"
        );
      },
    [layoutPlaceholderJSON]
  );

  return createNewChild ?? defaultCreateNewChild;
};

export const useLayoutProviderVersion = () => {
  const { version } = useContext(LayoutProviderContext);
  return version;
};
