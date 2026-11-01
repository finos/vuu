import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";
import {
  isTypedComponentTemplate,
  type TemplateSource,
  type TypedComponentTemplate,
} from "../GridLayoutContext";

export type TemplateDragMetrics = {
  elementHeight: number;
  elementWidth: number;
  labelWidth: number;
  x: number;
  y: number;
};

/**
 * Public, render-friendly view of an in-progress template drag.
 */
export interface TemplateDragState {
  /** true while a template (e.g. a palette entry) is being dragged. */
  readonly dragging: boolean;
  /**
   * The template being dragged, when it is a TypedComponentTemplate.
   * Undefined when no drag is in progress, or when a deprecated
   * LegacyComponentTemplate is being dragged.
   */
  readonly template?: TypedComponentTemplate;
}

const IDLE_TEMPLATE_DRAG_STATE: TemplateDragState = Object.freeze({
  dragging: false,
});

const toTypedTemplate = (
  source: TemplateSource,
): TypedComponentTemplate | undefined => {
  if (isTypedComponentTemplate(source)) {
    const { component, dropTarget, label } = source;
    return dropTarget === undefined
      ? { component, label }
      : { component, dropTarget, label };
  }
  return undefined;
};

export class TemplateDragSession {
  #dropped = false;
  #listeners = new Set<() => void>();
  #metrics: TemplateDragMetrics | undefined;
  #source: TemplateSource | undefined;
  #state: TemplateDragState = IDLE_TEMPLATE_DRAG_STATE;

  begin(source: TemplateSource, metrics: TemplateDragMetrics) {
    this.#dropped = false;
    this.#metrics = metrics;
    this.#source = source;
    this.#setState({ dragging: true, template: toTypedTemplate(source) });
  }

  completeDrop() {
    this.#dropped = true;
  }

  end() {
    this.#metrics = undefined;
    this.#source = undefined;
    this.#setState(IDLE_TEMPLATE_DRAG_STATE);
  }

  get dropped() {
    return this.#dropped;
  }

  get metrics() {
    return this.#metrics;
  }

  get source() {
    return this.#source;
  }

  /**
   * Immutable snapshot of the drag state. A new object is created only when
   * a drag begins or ends, never on pointer movement.
   */
  get state() {
    return this.#state;
  }

  subscribe = (listener: () => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  set x(value: number) {
    if (this.#metrics) {
      this.#metrics.x = value;
    }
  }

  set y(value: number) {
    if (this.#metrics) {
      this.#metrics.y = value;
    }
  }

  #setState(state: TemplateDragState) {
    if (state === this.#state) {
      return;
    }
    this.#state = state;
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

export const TemplateDragSessionContext = createContext<
  TemplateDragSession | undefined
>(undefined);

export const useTemplateDragSession = () =>
  useContext(TemplateDragSessionContext);

const NO_SUBSCRIPTION = () => () => undefined;
const getIdleState = () => IDLE_TEMPLATE_DRAG_STATE;

/**
 * Observe template drags (e.g. from a component palette) from anywhere under
 * a GridLayoutProvider, including components rendered outside a GridLayout,
 * such as an empty-workspace drop zone or a palette hint bar.
 *
 * The consuming component re-renders only when a template drag begins or
 * ends, not on pointer movement. Outside a GridLayoutProvider the hook
 * always returns `{ dragging: false }`.
 */
export const useTemplateDragState = (): TemplateDragState => {
  const session = useTemplateDragSession();
  const getSnapshot = useCallback(
    () => session?.state ?? IDLE_TEMPLATE_DRAG_STATE,
    [session],
  );
  return useSyncExternalStore(
    session?.subscribe ?? NO_SUBSCRIPTION,
    getSnapshot,
    getIdleState,
  );
};
