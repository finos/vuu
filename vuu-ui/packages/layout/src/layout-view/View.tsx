import { useForkRef, useId } from "@vuu-ui/react-utils";
import cx from "classnames";
import React, { ForwardedRef, forwardRef, useRef } from "react";
import { Header } from "../layout-header/Header";
import { registerComponent } from "../registry/ComponentRegistry";
import { ViewContext } from "./ViewContext";
import { ViewProps } from "./viewTypes";
import { useView } from "./useView";
import { useViewResize } from "./useViewResize";

import "./View.css";

const View = forwardRef(function View(
  props: ViewProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const {
    children,
    className,
    collapsed, // "vertical" | "horizontal" | false | undefined
    closeable,
    "data-resizeable": dataResizeable,
    dropTargets,
    expanded,
    flexFill, // use data-flexfill instead
    id: idProp,
    header,
    orientation = "horizontal",
    path,
    resize = "responsive", // maybe throttle or debounce ?
    resizeable = dataResizeable,
    tearOut,
    style = {},
    title: titleProp,
    ...restProps
  } = props;

  // A View within a managed layout will always be passed an id
  const id = useId(idProp);
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const {
    contributions,
    dispatchViewAction,
    load,
    loadSession,
    onConfigChange,
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
    // We only inject restored state as props if child is a single element. Maybe we
    // should take this further and only do it if the component has opted into this
    // behaviour.
    if (React.isValidElement(children) && restoredState) {
      return React.cloneElement(children, restoredState);
    } else {
      return children;
    }
  };

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
      <ViewContext.Provider
        value={{
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
        }}
      >
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
View.displayName = "View";

const MemoView = React.memo(View) as React.FunctionComponent<ViewProps>;
MemoView.displayName = "View";
registerComponent("View", MemoView, "view");

export { MemoView as View };
