import { useForkRef, useIdMemo as useId } from "@salt-ds/core";
import cx from "classnames";
import React, {
  ForwardedRef,
  forwardRef,
  ReactElement,
  useMemo,
  useRef,
} from "react";
import { Header } from "../layout-header/Header";
import { registerComponent } from "../registry/ComponentRegistry";
import { useView } from "./useView";
import { useViewResize } from "./useViewResize";
import { ViewContext } from "./ViewContext";
import { ViewProps } from "./viewTypes";

import "./View.css";

const View = forwardRef(function View(
  props: ViewProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const {
    children,
    className,
    collapsed,
    closeable,
    "data-resizeable": dataResizeable,
    dropTargets,
    expanded,
    flexFill,
    id: idProp,
    header,
    orientation = "horizontal",
    path,
    resize = "responsive",
    resizeable = dataResizeable,
    tearOut,
    style = {},
    title: titleProp,
    ...restProps
  } = props;

  const id = useId(idProp);
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const {
    contributions,
    dispatchViewAction,
    load,
    loadSession,
    onConfigChange,
    onEditTitle,
    purge,
    restoredState,
    save,
    saveSession,
    title,
  } = useView({
    id,
    rootRef,
    path,
    dropTargets,
    title: titleProp,
  });

  useViewResize({ mainRef, resize, rootRef });

  const classBase = "vuuView";

  const getContent = () => {
    if (React.isValidElement(children) && restoredState) {
      return React.cloneElement(children, restoredState);
    }
    return children;
  };

  const viewContextValue = useMemo(
    () => ({
      dispatch: dispatchViewAction,
      id,
      path,
      title,
      load,
      loadSession,
      onConfigChange,
      purge,
      save,
      saveSession,
    }),
    [
      dispatchViewAction,
      id,
      load,
      loadSession,
      onConfigChange,
      path,
      purge,
      save,
      saveSession,
      title,
    ]
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
            collapsed={collapsed}
            contributions={contributions}
            expanded={expanded}
            closeable={closeable}
            onEditTitle={onEditTitle}
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
    }
  ): ReactElement<ViewProps>;
  displayName?: string;
}

const MemoView = React.memo(View) as ViewComponentType;

MemoView.displayName = "View";

registerComponent("View", MemoView, "view");

export { MemoView as View };
