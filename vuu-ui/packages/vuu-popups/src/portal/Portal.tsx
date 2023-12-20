import { ThemeAttributes, useThemeAttributes } from "@finos/vuu-utils";
import { ReactNode, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import "./Portal.css";

export interface PortalProps {
  /**
   * The children to render into the `container`.
   */
  children?: ReactNode;
  /**
   * An HTML element, component instance, or function that returns either.
   * The `container` will have the portal children appended to it.
   *
   * By default, it uses the body of the top-level document object,
   * so it's simply `document.body` most of the time.
   */
  container?: Element | (() => Element | null) | null;
  /**
   * Id of element into which portal will be rendered. If this node does not exist on the document,
   * it will be created for you. If more than one value is provided, the first element found will
   * be used.
   */
  id?: string | string[];
  /**
   * Callback invoked immediately after render (in layoutEffect). Can be
   * used to check position vis-a-vis viewport and adjust if out of bounds
   */
  onRender?: () => void;
  /**
   * Allow conditional rendering of this Portal, if false, will render nothing.
   * Defaults to true
   */
  open?: boolean;
  /**
   * ThemeAttributes can be passed in for cases where ContextMenu is
   * rendered via popup-service showPopup, outside the Context hierarchy.
   */
  themeAttributes?: ThemeAttributes;
}

function getContainer(container: PortalProps["container"]) {
  return typeof container === "function" ? container() : container;
}

const DEFAULT_ID = ["vuu-dialog-portal-root", "vuu-portal-root"];

const getFirstAvailableElementById = (id: string | string[]) => {
  if (Array.isArray(id)) {
    for (const i of id) {
      const element = document.getElementById(i);
      if (element) {
        return element;
      }
    }
  } else {
    return document.getElementById(id);
  }
  return null;
};

/**
 * Portals provide a first-class way to render children into a DOM node
 * that exists outside the DOM hierarchy of the parent component.
 */
export const Portal = ({
  children,
  container: containerProp = document.body,
  id = DEFAULT_ID,
  onRender,
  open = true,
  themeAttributes,
}: PortalProps) => {
  const [mounted, setMounted] = useState(false);
  const portalRef = useRef<HTMLElement | null>(null);
  const container = getContainer(containerProp) ?? document.body;
  const [themeClass, densityClass, dataMode] =
    useThemeAttributes(themeAttributes);

  useLayoutEffect(() => {
    const root = getFirstAvailableElementById(id);
    if (root) {
      portalRef.current = root;
    } else {
      portalRef.current = document.createElement("div");
      portalRef.current.id =
        typeof id === "string"
          ? id
          : id.length > 0
          ? (id.at(-1) as string)
          : "vuu-portal-root";
    }
    const el = portalRef.current;
    if (!container.contains(el)) {
      container.appendChild(el);
    }
    el.classList.add(themeClass, densityClass);
    el.dataset.mode = dataMode;
    setMounted(true);
  }, [id, container, themeClass, densityClass, dataMode]);

  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      onRender?.();
    });
  }, [onRender]);

  if (open && mounted && portalRef.current && children) {
    return createPortal(children, portalRef.current);
  }

  return null;
};
