import React, { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';
import cx from 'classnames';
import { useForkRef, useId } from '@vuu-ui/react-utils';
import Header from './Header';
import { registerComponent } from './registry/ComponentRegistry';
import { useViewActionDispatcher } from './useViewActionDispatcher';
import useResizeObserver, { WidthHeight } from './responsive/useResizeObserver';
import useLayout from './useLayout';
import { LayoutContext, useLayoutDispatch } from './layout-context';
import usePersistentState from './use-persistent-state';

import './View.css';

const NO_MEASUREMENT = [];

const View = forwardRef(function View(inputProps, fwdRef) {
  const [props, ref] = useLayout('View', inputProps);
  const {
    children,
    className,
    collapsed, // "vertical" | "horizontal" | false | undefined
    closeable,
    'data-resizeable': dataResizeable,
    dropTargets,
    expanded,
    flexFill, // use data-flexfill instead
    id: idProp,
    header,
    orientation = 'horizontal',
    path,
    resize = 'responsive', // maybe throttle or debounce ?
    resizeable = dataResizeable,
    tearOut,
    style = {},
    title: titleProp,
    version = '0',
    ...restProps
  } = props;

  // A View within a managed layout will always be passed an id
  const id = useId(idProp);

  const layoutDispatch = useLayoutDispatch();
  const [dispatchViewAction, contributions] = useViewActionDispatcher(
    ref,
    path,
    layoutDispatch,
    dropTargets
  );
  const deferResize = resize === 'defer';
  const classBase = 'hwView';
  const { loadState, loadSessionState, saveState, saveSessionState } = usePersistentState();
  const title = useMemo(() => loadState('view-title') ?? titleProp, [loadState, titleProp]);

  const restoredState = useMemo(() => loadState(id), [id, loadState]);

  const mainRef = useRef(null);
  const mainSize = useRef({});
  const resizeHandle = useRef(null);

  const setMainSize = useCallback(() => {
    if (mainRef.current) {
      mainRef.current.style.height = mainSize.current.height + 'px';
      mainRef.current.style.width = mainSize.current.width + 'px';
    }
    resizeHandle.current = null;
  }, []);

  const onResize = useCallback(
    ({ height, width }) => {
      mainSize.current.height = height;
      mainSize.current.width = width;
      if (resizeHandle.current !== null) {
        clearTimeout(resizeHandle.current);
      }
      resizeHandle.current = setTimeout(setMainSize, 40);
    },
    [setMainSize]
  );

  useResizeObserver(ref, deferResize ? WidthHeight : NO_MEASUREMENT, onResize, deferResize);

  const load = useCallback((key) => loadState(id, key), [id, loadState]);
  const save = useCallback(
    (state, key) => {
      saveState(id, key, state);
      layoutDispatch({ type: 'save' });
    },
    [id, layoutDispatch, saveState]
  );
  const loadSession = useCallback((key) => loadSessionState(id, key), [id, loadSessionState]);
  const saveSession = useCallback(
    (state, key, stateType) => saveSessionState(id, key, state, stateType),
    [id, saveSessionState]
  );

  const onConfigChange = useCallback(
    ({ type: key, ...config }) => {
      const { [key]: data } = config;
      save(data, key);
    },
    [save]
  );

  const getContent = () => {
    // We only inject restored state as props if child is a single element. Maybe we
    // should take this further and only do it if the component has opted into this
    // behaviour.
    if (React.isValidElement(children) && restoredState) {
      return React.cloneElement(children, restoredState);
    } else {
      return children;
    }
  };

  const headerProps = typeof header === 'object' ? header : {};

  return (
    <div
      {...restProps}
      className={cx(classBase, className, {
        [`${classBase}-collapsed`]: collapsed,
        [`${classBase}-expanded`]: expanded,
        [`${classBase}-resize-defer`]: resize === 'defer'
      })}
      data-resizeable={resizeable}
      id={id}
      ref={useForkRef(fwdRef, ref)}
      style={style}
      tabIndex={-1}>
      <LayoutContext.Provider
        value={{
          dispatch: dispatchViewAction,
          id,
          path,
          title,
          load,
          loadSession,
          onConfigChange,
          save,
          saveSession
        }}>
        {header ? (
          <Header
            {...headerProps}
            collapsed={collapsed}
            contributions={contributions}
            expanded={expanded}
            closeable={closeable}
            orientation={collapsed || orientation}
            tearOut={tearOut}
            // title={`${title} v${version} #${id}`}
            title={title}
          />
        ) : null}
        <div className={`${classBase}-main`} ref={mainRef}>
          {getContent()}
        </div>
      </LayoutContext.Provider>
    </div>
  );
});
View.displayName = 'View';

const MemoView = React.memo(View);
MemoView.displayName = 'View';
export default MemoView;
registerComponent('View', MemoView, 'view');
