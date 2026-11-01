import {
  DragDropProviderNext,
  type TemplateSource,
  type TypedComponentTemplate,
  useDraggable,
  useOptionalDragContext,
} from "@vuu-ui/grid-layout";
import { queryClosest } from "@vuu-ui/vuu-utils";
import {
  type DragEvent,
  type DragEventHandler,
  type ReactNode,
  useCallback,
  useId,
} from "react";

const NOOP = () => undefined;

/**
 * Provides the drag runtime that `usePortalDragSource` needs, for drag
 * sources rendered outside a GridLayout, such as a palette. Renders its
 * children unchanged when a drag runtime is already present.
 *
 * It must be rendered under the same `GridLayoutProvider` as the workspace
 * GridLayout: a template drag reaches only GridLayouts that share that
 * provider's drag session. It deliberately doesn't create a provider of its
 * own, which would isolate its drags.
 */
export const PortalDragSourceScope = ({
  children,
}: {
  children: ReactNode;
}) => {
  const dragContext = useOptionalDragContext();
  const scopeId = useId();
  if (dragContext) {
    return children;
  }
  return (
    <DragDropProviderNext
      dragSources={{}}
      onCancelTabDrag={NOOP}
      onDetachTab={NOOP}
      onDrop={NOOP}
    >
      <div
        className="vuuGridLayout"
        id={`vuu-portal-drag-source-${scopeId}`}
        style={{ display: "contents" }}
      >
        {children}
      </div>
    </DragDropProviderNext>
  );
};

export interface PortalDragSourceProps {
  "data-template-component-type": string;
  draggable: true;
  onDragEnd: DragEventHandler<HTMLElement>;
  onDragStart: DragEventHandler<HTMLElement>;
}

export interface PortalDragSourceOptions {
  /** Called when the drag ends; `dropped` is false if it was cancelled. */
  onDragEnd?: (dropped: boolean) => void;
}

/**
 * Makes an element a drag source for a workspace item: spread the returned
 * props onto it. Dropping it on a workspace GridLayout adds an item rendered
 * from `template`, e.g. one built with `portalModuleTemplate` or
 * `vuuTableTemplate`.
 *
 * Must be used under `PortalDragSourceScope` (or within a GridLayout), under
 * the workspace's `GridLayoutProvider`. Remote modules that use it must share
 * `@vuu-ui/grid-layout` with the host as a Module Federation singleton.
 */
export const usePortalDragSource = (
  template: TypedComponentTemplate,
  { onDragEnd }: PortalDragSourceOptions = {},
): PortalDragSourceProps => {
  if (!useOptionalDragContext()) {
    throw Error(
      "[usePortalDragSource] no drag runtime, render the drag source within PortalDragSourceScope, under the workspace GridLayoutProvider",
    );
  }
  const getDragSource = useCallback(
    (event: DragEvent<Element>): TemplateSource => {
      const element = event.currentTarget as HTMLElement;
      return {
        ...template,
        element,
        layoutId:
          queryClosest(element, ".vuuGridLayout")?.id ??
          "vuu-portal-drag-source",
        type: "template",
      };
    },
    [template],
  );
  const handleDragEnd = useCallback(
    (_event: DragEvent<HTMLElement>, dropped: boolean) => onDragEnd?.(dropped),
    [onDragEnd],
  );
  const draggable = useDraggable({ getDragSource, onDragEnd: handleDragEnd });
  return {
    ...draggable,
    "data-template-component-type": template.component.type,
    draggable: true,
  };
};
