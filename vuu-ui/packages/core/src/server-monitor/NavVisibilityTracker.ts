import type { ModuleId } from "../connection-management/ModuleServerMap";

/**
 * Tracks which nav items are visible, using one `IntersectionObserver` for
 * all of them. Where `IntersectionObserver` is unavailable, every registered
 * item counts as visible.
 */
export class NavVisibilityTracker {
  readonly #elements = new Map<Element, ModuleId>();
  readonly #observer?: IntersectionObserver;
  readonly #onChange: (visible: ModuleId[]) => void;
  readonly #visible = new Set<Element>();
  #notifyScheduled = false;

  constructor(onChange: (visible: ModuleId[]) => void) {
    this.#onChange = onChange;
    if (typeof IntersectionObserver !== "undefined") {
      this.#observer = new IntersectionObserver((entries) => {
        for (const { isIntersecting, target } of entries) {
          if (isIntersecting) {
            this.#visible.add(target);
          } else {
            this.#visible.delete(target);
          }
        }
        this.#scheduleNotify();
      });
    }
  }

  observe(element: Element, moduleId: ModuleId) {
    this.#elements.set(element, moduleId);
    if (this.#observer) {
      this.#observer.observe(element);
    } else {
      this.#visible.add(element);
      this.#scheduleNotify();
    }
    return () => {
      this.#elements.delete(element);
      this.#visible.delete(element);
      this.#observer?.unobserve(element);
      this.#scheduleNotify();
    };
  }

  disconnect() {
    this.#observer?.disconnect();
    this.#elements.clear();
    this.#visible.clear();
  }

  // Batched, as items mount and intersect together.
  #scheduleNotify() {
    if (!this.#notifyScheduled) {
      this.#notifyScheduled = true;
      queueMicrotask(() => {
        this.#notifyScheduled = false;
        const visible = new Set<ModuleId>();
        for (const element of this.#visible) {
          const moduleId = this.#elements.get(element);
          if (moduleId !== undefined) {
            visible.add(moduleId);
          }
        }
        this.#onChange([...visible]);
      });
    }
  }
}
