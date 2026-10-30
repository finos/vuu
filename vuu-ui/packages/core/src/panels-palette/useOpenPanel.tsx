import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  type GridItemId,
  type GridLayoutCommands,
  type GridSnapshot,
  type TypedComponentTemplate,
  useGridLayoutCommands,
} from "@heswell/grid-layout";
import type { GridLayoutSplitDirection } from "@vuu-ui/vuu-utils";
import {
  createContext,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { OpenPanelPrompt } from "./OpenPanelPrompt";
import type { PanelDefaultSize } from "./panel-items";

import panelsPaletteCss from "./PanelsPalette.css";

/**
 * How a panel was opened: added to the workspace, replacing a panel, or
 * stacked as a new tab with the focused panel. `cancel` if the user
 * dismissed the prompt.
 */
export type OpenPanelAction = "add" | "replace" | "stack";

export interface OpenPanelResult {
  readonly action: OpenPanelAction | "cancel";
  /** The id of the new grid item, unless cancelled. */
  readonly itemId?: GridItemId;
}

export interface OpenPanelOptions {
  /** Size hint used when the panel is added by splitting another panel. */
  readonly defaultSize?: PanelDefaultSize;
}

export interface OpenPanelAPI {
  /**
   * Adds a panel: fills an empty area of the workspace, or splits the focused
   * panel. Used by the + button of a palette row.
   */
  addPanel: (
    template: TypedComponentTemplate,
    options?: OpenPanelOptions,
  ) => OpenPanelResult;
  /** The panel that "Replace" and "Open as new tab" apply to, if any. */
  getFocusedPanelId: () => GridItemId | undefined;
  /**
   * Opens a panel following the click rule. With no panels, adds it. With
   * exactly one, replaces it. With more than one, asks the user to replace
   * the focused panel (R) or open a new tab beside it (T); Esc cancels.
   */
  openPanel: (
    template: TypedComponentTemplate,
    options?: OpenPanelOptions,
  ) => Promise<OpenPanelResult>;
}

const OpenPanelContext = createContext<OpenPanelAPI | undefined>(undefined);

const isVisible = (snapshot: GridSnapshot, itemId: GridItemId) => {
  const stack = snapshot.stacks.find(({ itemIds }) => itemIds.includes(itemId));
  return stack === undefined || stack.selectedItemId === itemId;
};

/**
 * The direction to split `targetId` in, to add a panel of `defaultSize`. A
 * wide panel (more columns than rows) goes below the target, a tall one
 * beside it. Otherwise the target is split along its longer side.
 */
export const getSplitPosition = (
  defaultSize: PanelDefaultSize,
  target?: Element | null,
): GridLayoutSplitDirection => {
  const cols = defaultSize?.cols ?? 0;
  const rows = defaultSize?.rows ?? 0;
  if (cols !== rows) {
    return cols > rows ? "south" : "east";
  }
  const rect = target?.getBoundingClientRect();
  return rect && rect.height > rect.width ? "south" : "east";
};

const getPanelElement = (container: Element | null, itemId: GridItemId) =>
  container?.querySelector(`[id="${CSS.escape(itemId)}"]`) ?? null;

interface PendingPrompt {
  readonly label: string;
  readonly resolve: (result: OpenPanelResult) => void;
  readonly targetId: GridItemId;
  readonly template: TypedComponentTemplate;
}

export interface OpenPanelProviderProps {
  children: ReactNode;
  /** The GridLayout panels are opened in. Default: the first in the provider. */
  gridId?: string;
}

/**
 * Provides `useOpenPanel` to its children, for the GridLayout `gridId`.
 * Tracks the focused panel (the last one focused or clicked) and renders the
 * Replace / Open as new tab prompt. Must be rendered within the
 * GridLayoutProvider of the GridLayout, around both the GridLayout and the
 * components that open panels, such as `PanelsPalette`.
 */
export const OpenPanelProvider = ({
  children,
  gridId,
}: OpenPanelProviderProps) => {
  useComponentCssInjection({
    testId: "vuu-panels-palette",
    css: panelsPaletteCss,
    window: useWindow(),
  });
  const commands = useGridLayoutCommands(gridId);
  const commandsRef = useRef<GridLayoutCommands | undefined>(commands);
  commandsRef.current = commands;
  const containerRef = useRef<HTMLDivElement>(null);
  const focusedRef = useRef<GridItemId | undefined>(undefined);
  const [prompt, setPrompt] = useState<PendingPrompt>();

  const getCommands = useCallback(() => {
    const current = commandsRef.current;
    if (!current) {
      throw Error(
        "[OpenPanelProvider] the workspace GridLayout is not mounted",
      );
    }
    return current;
  }, []);

  const trackFocus = useCallback(
    (event: FocusEvent<HTMLElement> | PointerEvent<HTMLElement>) => {
      const element =
        event.target instanceof Element
          ? event.target.closest(".vuuGridLayoutItem")
          : null;
      if (element?.id) {
        focusedRef.current = element.id;
      }
    },
    [],
  );

  const getFocusedPanelId = useCallback(() => {
    const current = commandsRef.current;
    if (!current) {
      return undefined;
    }
    const snapshot = current.getSnapshot();
    const contentIds = current.getContentItemIds();
    let focusedId = focusedRef.current;
    const focusedStack = snapshot.stacks.find(({ id }) => id === focusedId);
    if (focusedStack) {
      focusedId = focusedStack.selectedItemId;
    }
    if (focusedId && contentIds.includes(focusedId)) {
      return focusedId;
    }
    const visible = contentIds.filter((itemId) => isVisible(snapshot, itemId));
    return visible.at(-1) ?? contentIds.at(-1);
  }, []);

  const insert = useCallback(
    (
      template: TypedComponentTemplate,
      action: OpenPanelAction,
      targetId: GridItemId,
      position?: GridLayoutSplitDirection,
    ): OpenPanelResult => {
      const itemId = getCommands().insertTemplate(
        template,
        position
          ? { kind: "split", position, targetId }
          : { kind: action === "stack" ? "stack" : "replace", targetId },
      );
      focusedRef.current = itemId;
      return { action, itemId };
    },
    [getCommands],
  );

  const addPanel = useCallback<OpenPanelAPI["addPanel"]>(
    (template, { defaultSize } = {}) => {
      const current = getCommands();
      const [placeholderId] = current.getPlaceholderIds();
      if (placeholderId) {
        const result = insert(template, "replace", placeholderId);
        return { ...result, action: "add" };
      }
      const targetId = getFocusedPanelId();
      if (!targetId) {
        throw Error("[OpenPanelProvider] the workspace has no area to add to");
      }
      const position = getSplitPosition(
        defaultSize,
        getPanelElement(containerRef.current, targetId),
      );
      return insert(template, "add", targetId, position);
    },
    [getCommands, getFocusedPanelId, insert],
  );

  const openPanel = useCallback<OpenPanelAPI["openPanel"]>(
    (template, options) => {
      const current = getCommands();
      const contentIds = current.getContentItemIds();
      if (contentIds.length === 0) {
        return Promise.resolve(addPanel(template, options));
      }
      if (contentIds.length === 1) {
        return Promise.resolve(insert(template, "replace", contentIds[0]));
      }
      const targetId = getFocusedPanelId() ?? contentIds[0];
      const label =
        current.getSnapshot().items.find(({ id }) => id === targetId)?.title ??
        "panel";
      return new Promise<OpenPanelResult>((resolve) => {
        setPrompt((pending) => {
          pending?.resolve({ action: "cancel" });
          return { label, resolve, targetId, template };
        });
      });
    },
    [addPanel, getCommands, getFocusedPanelId, insert],
  );

  const handlePromptChoice = useCallback(
    (choice: "replace" | "stack" | "cancel") => {
      if (!prompt) {
        return;
      }
      setPrompt(undefined);
      if (choice === "cancel") {
        prompt.resolve({ action: "cancel" });
      } else {
        prompt.resolve(insert(prompt.template, choice, prompt.targetId));
      }
    },
    [insert, prompt],
  );

  const api = useMemo<OpenPanelAPI>(
    () => ({ addPanel, getFocusedPanelId, openPanel }),
    [addPanel, getFocusedPanelId, openPanel],
  );

  return (
    <OpenPanelContext.Provider value={api}>
      <div
        className="vuuOpenPanelScope"
        onFocusCapture={trackFocus}
        onPointerDownCapture={trackFocus}
        ref={containerRef}
      >
        {children}
        {prompt ? (
          <OpenPanelPrompt
            label={prompt.label}
            onChoice={handlePromptChoice}
            target={getPanelElement(containerRef.current, prompt.targetId)}
            templateLabel={prompt.template.label}
          />
        ) : null}
      </div>
    </OpenPanelContext.Provider>
  );
};

/**
 * Opens panels in the workspace following the click rule, see
 * `OpenPanelAPI`. Must be used within `OpenPanelProvider`.
 */
export const useOpenPanel = (): OpenPanelAPI => {
  const api = useContext(OpenPanelContext);
  if (!api) {
    throw Error("[useOpenPanel] must be used within an OpenPanelProvider");
  }
  return api;
};

/** `useOpenPanel`, or undefined outside an `OpenPanelProvider`. */
export const useOptionalOpenPanel = () => useContext(OpenPanelContext);
