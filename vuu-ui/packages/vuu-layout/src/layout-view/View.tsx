import { registerComponent, useId } from "@vuu-ui/vuu-utils";
import { useForkRef } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import React, {
  ForwardedRef,
  forwardRef,
  ReactElement,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { Header as VuuHeader } from "../layout-header/Header";
import { useView } from "./useView";
import { useViewResize } from "./useViewResize";
import { ViewContext, ViewContextAPI } from "../layout-view-actions";
import { ViewProps } from "./viewTypes";

import viewCss from "./View.css";

const classBase = "vuuView";

type Props = { [key: string]: unknown };

const getProps = (state?: Props, props?: Props) => {
  if (state && props) {
    return {
      ...state,
      ...props,
    };
  } else return state || props;
};

/**
 * View is the leaf-level entity managed by the Vuu layout system. It may represent a component
 * or a group of components. It also offers an API (via useViewContext) for persistence.
 */
const View = forwardRef(function View(
  props: ViewProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const {
    Header = VuuHeader,
    allowRename,
    children,
    className,
    collapsed,
    closeable,
    "data-path": dataPath,
    "data-resizeable": dataResizeable,
    dropTargets,
    expanded,
    flexFill,
    id: idProp,
    header,
    onCollapse,
    onExpand,
    orientation = "horizontal",
    path = dataPath,
    resize = "responsive",
    resizeable = dataResizeable,
    restoreStyle,
    tearOut,
    style = {},
    title: titleProp,
    ...restProps
  } = props;

  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-view",
    css: viewCss,
    window: targetWindow,
  });

  const id = useId(idProp);

  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const [componentProps, _setComponentProps] = useState<Props>();
  const {
    contributions,
    dispatchViewAction,
    load,
    onConfigChange,
    onEditTitle,
    purge,
    restoredState,
    save,
    title,
  } = useView({
    id,
    rootRef,
    path,
    dropTargets,
    title: titleProp,
  });

  useViewResize({ mainRef, resize, rootRef });

  const setComponentProps = useCallback((props?: Props) => {
    _setComponentProps(props);
  }, []);

  const getContent = () => {
    if (React.isValidElement(children) && (restoredState || componentProps)) {
      return React.cloneElement(
        children,
        getProps(restoredState, componentProps),
      );
    }
    return children;
  };

  const viewContextValue: ViewContextAPI = useMemo(
    () => ({
      dispatch: dispatchViewAction,
      id,
      path,
      title,
      load,
      onConfigChange,
      purge,
      save,
      setComponentProps,
    }),
    [
      dispatchViewAction,
      id,
      load,
      onConfigChange,
      path,
      purge,
      save,
      setComponentProps,
      title,
    ],
  );

  const headerProps = typeof header === "object" ? header : {};

  return (
    <div
      {...restProps}
      className={cx(classBase, className, {
        [`${classBase}-collapsed`]: collapsed,
        [`${classBase}-expanded`]: expanded,
        [`${classBase}-resize-defer`]: resize === "defer",
      })}
      data-resizeable={resizeable}
      id={id}
      ref={useForkRef(forwardedRef, rootRef)}
      style={style}
      tabIndex={-1}
    >
      <ViewContext.Provider value={viewContextValue}>
        {header ? (
          <Header
            {...headerProps}
            allowRename={allowRename}
            collapsed={collapsed}
            contributions={contributions}
            expanded={expanded}
            closeable={closeable}
            onCollapse={onCollapse}
            onEditTitle={onEditTitle}
            onExpand={onExpand}
            orientation={orientation}
            tearOut={tearOut}
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
View.displayName = "View";

interface ViewComponentType {
  (
    props: ViewProps & {
      ref?: ForwardedRef<HTMLDivElement>;
    },
  ): ReactElement<ViewProps>;
  displayName?: string;
}

const MemoView = React.memo(View) as ViewComponentType;

MemoView.displayName = "View";

registerComponent("View", MemoView, "view");

export { MemoView as View };
