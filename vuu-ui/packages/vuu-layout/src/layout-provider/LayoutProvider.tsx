import {
  VuuShellLocation,
  logger,
  usePlaceholderJSON,
  type LayoutJSON,
} from "@vuu-ui/vuu-utils";
import {
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
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
import { findTarget, getChildProp, getProp, getProps, typeOf } from "../utils";
import {
  LayoutProviderContext,
  LayoutProviderDispatch,
} from "./LayoutProviderContext";
import { useLayoutDragDrop } from "./useLayoutDragDrop";
import { SaveAction } from "../layout-view/viewTypes";

const { info } = logger("LayoutProvider");

const isWorkspaceContainer = (props: LayoutProps) =>
  props.id === VuuShellLocation.WorkspaceContainer;

const isMultiWorkspaceContainer = (props: LayoutProps) =>
  props.id === VuuShellLocation.MultiWorkspaceContainer;

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
  action: LayoutReducerAction | SaveAction,
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
  workspaceJSON?: LayoutJSON | LayoutJSON[];
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
    (source: ReactElement, layoutChangeReason: LayoutChangeReason) => {
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
    [onLayoutChange],
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
    [forceRefresh, serializeState],
  );

  const addComponentToWorkspace = useCallback(
    (component: ReactElement) => {
      dispatchLayoutAction({
        type: "add",
        path: `#${VuuShellLocation.Workspace}`,
        component,
      });
    },
    [dispatchLayoutAction],
  );

  const switchWorkspace = useCallback(
    (idx: number) => {
      dispatchLayoutAction({
        type: "switch-tab",
        nextIdx: idx,
        path: `#${VuuShellLocation.MultiWorkspaceContainer}`,
      });
    },
    [dispatchLayoutAction],
  );

  const showComponentInContextPanel = useCallback(
    (
      component: ReactElement | LayoutJSON,
      title?: string,
      onContextPanelClose?: () => void,
    ) => {
      dispatchLayoutAction({
        type: "set-props",
        path: `#${VuuShellLocation.ContextPanel}`,
        props: {
          expanded: true,
          content: component,
          onClose: onContextPanelClose,
          title,
        },
      });
    },
    [dispatchLayoutAction],
  );

  const layoutActionDispatcher = useCallback<LayoutProviderDispatch>(
    (action) => {
      switch (action.type) {
        case "drag-start": {
          prepareToDragLayout(action);
          break;
        }
        case "save": {
          if (state.current) {
            serializeState(state.current, getLayoutChangeReason(action));
          }
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
    [dispatchLayoutAction, serializeState],
  );

  const prepareToDragLayout = useLayoutDragDrop(
    state as RefObject<ReactElement>,
    layoutActionDispatcher,
    pathToDropTarget,
  );

  useEffect(() => {
    if (workspaceJSON) {
      info?.("workspaceJSON changed. inject new layout into application");
      if (Array.isArray(workspaceJSON)) {
        const targetContainer = findTarget(
          state.current,
          isMultiWorkspaceContainer,
        ) as ReactElement;
        if (targetContainer) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { path: targetContainerPath } = targetContainer.props as any;
          const target = getChildProp(targetContainer);
          const newLayouts = workspaceJSON.map((ws, i) =>
            layoutFromJson(ws, `${targetContainerPath}.${i}`),
          );
          const action = target
            ? {
                type: LayoutActionType.REPLACE,
                target,
                replacement: newLayouts,
              }
            : {
                type: LayoutActionType.ADD,
                path: targetContainerPath,
                component: newLayouts,
              };
          dispatchLayoutAction(action, true);
        }
      } else {
        const targetContainer = findTarget(
          state.current,
          isWorkspaceContainer,
        ) as ReactElement;
        if (targetContainer) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { path: targetContainerPath } = targetContainer.props as any;
          const target = getChildProp(targetContainer);
          const newLayout = layoutFromJson(
            workspaceJSON,
            `${targetContainerPath}.0`,
          );
          const action = target
            ? {
                type: LayoutActionType.REPLACE,
                target,
                replacement: newLayout,
              }
            : {
                type: LayoutActionType.ADD,
                path: targetContainerPath,
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
        } else {
          throw Error(
            `LayoutProvider unable to render new workspaceJson, no valid target container. Use a valid Shell Layout Template or include a container with the standard workspace id '${VuuShellLocation.Workspace}' `,
          );
        }
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
        addComponentToWorkspace,
        createNewChild,
        dispatchLayoutProvider: layoutActionDispatcher,
        showComponentInContextPanel,
        switchWorkspace,
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

export const useLayoutOperation = () => {
  const {
    addComponentToWorkspace,
    showComponentInContextPanel,
    switchWorkspace,
  } = useContext(LayoutProviderContext);
  return {
    addComponentToWorkspace,
    showComponentInContextPanel,
    switchWorkspace,
  };
};

export const useLayoutCreateNewChild = () => {
  const layoutPlaceholderJSON = usePlaceholderJSON();
  const { createNewChild } = useContext(LayoutProviderContext);

  const defaultCreateNewChild = useMemo(
    () =>
      function createNewChild() {
        if (layoutPlaceholderJSON) {
          const { props } = layoutPlaceholderJSON;
          return layoutFromJson(
            {
              ...layoutPlaceholderJSON,
              props: {
                ...props,
                resizeable: true,
                style: {
                  ...props?.style,
                  flexGrow: 1,
                  flexShrink: 0,
                  flexBasis: 0,
                },
              },
            },
            "0",
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
          "0",
        );
      },
    [layoutPlaceholderJSON],
  );

  return createNewChild ?? defaultCreateNewChild;
};

export const useLayoutProviderVersion = () => {
  const { version } = useContext(LayoutProviderContext);
  return version;
};
