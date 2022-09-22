import { useForkRef, useId } from '@vuu-ui/react-utils';
import cx from 'classnames';
import React, { ForwardedRef, forwardRef, useCallback, useMemo, useRef } from 'react';
import Header from '../layout-header/Header';
import { useLayoutProviderDispatch } from '../layout-provider';
import { registerComponent } from '../registry/ComponentRegistry';
import {useResizeObserver,  WidthHeight } from '../responsive/useResizeObserver';
import usePersistentState from '../use-persistent-state';
import { useViewActionDispatcher } from './useViewActionDispatcher';
import { ViewContext } from './ViewContext';
import { ViewProps } from './viewTypes';

import './View.css';

const NO_MEASUREMENT: string[] = [];

type size = {
  height?: number;
  width?: number;
};

const View = forwardRef(function View(
  props: ViewProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
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
    ...restProps
  } = props;

  // A View within a managed layout will always be passed an id
  const id = useId(idProp);
  const rootRef = useRef<HTMLDivElement>(null);

  const layoutDispatch = useLayoutProviderDispatch();
  const [dispatchViewAction, contributions] = useViewActionDispatcher(rootRef, path, dropTargets);
  const deferResize = resize === 'defer';
  const classBase = 'hwView';
  const { loadState, loadSessionState, saveState, saveSessionState } = usePersistentState();
  const title = useMemo(() => loadState('view-title') ?? titleProp, [loadState, titleProp]);

  const restoredState = useMemo(() => loadState(id), [id, loadState]);

  const mainRef = useRef<HTMLDivElement>(null);
  const mainSize = useRef<size>({});
  const resizeHandle = useRef<number>();

  const setMainSize = useCallback(() => {
    if (mainRef.current) {
      mainRef.current.style.height = mainSize.current.height + 'px';
      mainRef.current.style.width = mainSize.current.width + 'px';
    }
    resizeHandle.current = undefined;
  }, []);

  const onResize = useCallback(
    ({ height, width }) => {
      mainSize.current.height = height;
      mainSize.current.width = width;
      if (resizeHandle.current !== null) {
        clearTimeout(resizeHandle.current);
      }
      resizeHandle.current = window.setTimeout(setMainSize, 40);
    },
    [setMainSize]
  );

  useResizeObserver(rootRef, deferResize ? WidthHeight : NO_MEASUREMENT, onResize, deferResize);

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
    (state, key) => saveSessionState(id, key, state),
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
      ref={useForkRef(forwardedRef, rootRef)}
      style={style}
      tabIndex={-1}>
      <ViewContext.Provider
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
            orientation={/*collapsed || */ orientation}
            tearOut={tearOut}
            // title={`${title} v${version} #${id}`}
            title={title}
          />
        ) : null}
        <div className={`${classBase}-main`} ref={mainRef}>
          {getContent()}
        </div>
      </ViewContext.Provider>
    </div>
  );
});
View.displayName = 'View';

const MemoView = React.memo(View) as React.FunctionComponent<ViewProps>;
MemoView.displayName = 'View';
registerComponent('View', MemoView, 'view');

export { MemoView as View };
