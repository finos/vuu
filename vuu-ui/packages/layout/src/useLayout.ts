import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import {
  LayoutActionType,
  layoutReducer,
  LayoutReducerAction,
  applyLayout,
  layoutFromJson,
  layoutToJSON,
  LayoutModel,
  layoutType,
  SaveAction
} from './layout-reducer';
import useNavigation from './layout-hooks/useLayoutNavigation';
import { useLayoutDispatch } from './layout-context';
import { findTarget, getChildProp, getProps, typeOf } from './utils';

const withDropTarget = (props: any) => props.dropTarget;
/**
 * Root layout node will never receive dispatch. It may receive a layoutModel,
 * in which case UI will be built from model. Only root stores layoutModel in
 * state and only root updates layoutModel. Non-root layout nodes always return
 * layoutModel from props. Root node, if seeded with layoutModel stores this in
 * state and subsequently manages layoutModel in state.
 */
const useLayout = (layoutType: layoutType, props: any) => {
  const dispatch = useLayoutDispatch();
  const isRoot = dispatch === null && layoutType !== 'View';
  const ref = useRef(null);
  // Only the root layout actually stores state here
  const state = useRef<LayoutModel | undefined>(undefined);
  const children = useRef(null);
  const { onLayoutChange } = props;

  const layout = useRef(props.layout);
  const [, forceRefresh] = useState<any>(null);
  const updateState = useCallback(
    (nextState) => {
      if (nextState !== state.current) {
        state.current = nextState;
        forceRefresh({});
        return true;
      }
    },
    [forceRefresh]
  );

  const navigationDispatcher = useNavigation(layoutType, props, ref, state);

  const serializeState = useCallback(
    (source) => {
      if (onLayoutChange) {
        const targetContainer = findTarget(source, withDropTarget) || state.current;
        const isDraggableLayout =
          (isRoot && layoutType === 'DraggableLayout') ||
          typeOf(targetContainer) === 'DraggableLayout';

        const target = isDraggableLayout
          ? getProps(targetContainer as LayoutModel).children[0]
          : targetContainer;

        const serializedModel = layoutToJSON(target);
        onLayoutChange(serializedModel, 'drag-root');
      }
    },
    [isRoot, layoutType, onLayoutChange]
  );

  const dispatchLayoutAction = useRef(
    dispatch ||
      ((action: LayoutReducerAction | SaveAction) => {
        // A custom dispatcher should return true to indicate that it has handled this action.
        // A custom dispatcher alone will not refresh the layout state, it must ultimately
        // dispatch a  layout action that will be handled below.It can be used to defer an action
        // that has async pre-requisites or initiate an operation that may or may not progress
        // to actual layour re-render e.g layout drag drop.
        if (navigationDispatcher && navigationDispatcher(action)) {
          return;
        }

        if (action.type === 'save') {
          // It may seem pointless saving state outside of a layoput operation, but there may be
          // component-level persistent state which will be included in the serialized layout tree.
          serializeState(state.current);
          return;
        } else if (state.current) {
          // NOte state.current will never be undefined here
          const nextState = layoutReducer(state.current, action);
          if (updateState(nextState)) {
            if (
              ['drag-drop', 'remove', 'set-title', 'splitter-resize', 'switch-tab'].includes(
                action.type
              )
            ) {
              serializeState(nextState);
            }
          }
        }
      })
  );

  // Detect dynamic layout reset from serialized layout
  useEffect(() => {
    // Note: state.current will never be undefined here
    if (props.layout !== layout.current && state.current !== undefined) {
      const targetContainer = findTarget(state.current, withDropTarget) as ReactElement;
      const target = getChildProp(targetContainer);
      const newLayout = layoutFromJson(props.layout, `${targetContainer.props.path}.0`);
      const nextState = target
        ? layoutReducer(state.current, {
            type: LayoutActionType.REPLACE,
            target,
            replacement: newLayout
          })
        : layoutReducer(state.current, {
            type: LayoutActionType.ADD,
            path: targetContainer.props.path,
            component: newLayout
          });
      updateState(nextState);
      layout.current = props.layout;
    }
  }, [layoutType, props, updateState]);

  if (isRoot && (state.current === undefined || children.current !== props.children)) {
    // onsole.log(
    //   `LAYOUT ROOT COMPONENT (${layoutType})_____ (useLayout regenerated layout structure)`
    // );
    children.current = props.children;
    // TODO should be a call to the reducer
    // If props.layout is set ???
    state.current = applyLayout(layoutType, props, state.current);
  }

  const layoutProps = isRoot ? state.current : props;
  return [layoutProps, ref, dispatchLayoutAction.current, isRoot];
};

export default useLayout;
