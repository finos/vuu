import { ReactElement, useLayoutEffect, useMemo } from "react";
import * as ReactDOM from "react-dom";
import { createContainer, renderPortal } from "./render-portal";
import { useThemeAttributes } from "@finos/vuu-shell";
import cx from "classnames";

export interface PortalDeprecatedProps {
  children: ReactElement;
  onRender?: () => void;
  x?: number;
  y?: number;
}

export const PortalDeprecated = function Portal({
  children,
  x = 0,
  y = 0,
  onRender,
}: PortalDeprecatedProps) {
  // Do we need to accept container here as a prop ?
  const [themeClass, densityClass, dataMode] = useThemeAttributes();
  const renderContainer = useMemo(() => {
    return createContainer({
      className: cx(themeClass, densityClass),
      dataMode,
    });
  }, [dataMode, densityClass, themeClass]);

  useLayoutEffect(() => {
    renderPortal(children, renderContainer, x, y, onRender);
  }, [children, onRender, renderContainer, x, y]);

  useLayoutEffect(() => {
    return () => {
      if (renderContainer) {
        ReactDOM.unmountComponentAtNode(renderContainer);
        if (renderContainer.classList.contains("vuuPopup")) {
          renderContainer.parentElement?.removeChild(renderContainer);
        }
      }
    };
  }, [renderContainer]);

  // useLayoutEffect(() => {
  //   renderContainer.current = renderPortal(children, x, y, container)
  //   return () => {
  //     if (renderContainer.current){
  //       console.log('EXPLICIT UNMOUNT')
  //       ReactDOM.unmountComponentAtNode(renderContainer.current);
  //       if (renderContainer.current.classList.contains('hwReactPopup')){
  //         renderContainer.current.parentElement.removeChild(renderContainer.current);
  //         renderContainer.current = null;
  //       }
  //     }
  //   }
  // },[])
  return null;
};
