import { createContext, useContext } from "react";

/**
 * Identifies one rendered instance of a module, e.g. the id of the
 * workspace item that renders it. The same module can be rendered by
 * several items at once, e.g. in the tabs of a stack, so a module that
 * caches state by key, such as session data sources, should scope those
 * keys with this id.
 */
export const PortalModuleInstanceContext = createContext<string | undefined>(
  undefined,
);

/**
 * The id of the module instance rendering this subtree, or undefined when
 * the module is rendered by its own full-page route.
 */
export const usePortalModuleInstanceId = () =>
  useContext(PortalModuleInstanceContext);
