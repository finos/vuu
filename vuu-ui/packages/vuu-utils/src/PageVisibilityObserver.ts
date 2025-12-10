import { EventEmitter } from "./event-emitter";

export type PageVisibilityEvents = {
  /**
   * emits when page has been hidden for this period of time
   */
  "inactive-timeout": () => void;
  /**
   * emits when page is hidden
   */
  hidden: () => void;
  /**
   * emits when page is made visible
   */
  visible: () => void;
  /**
   * emits when page visibility status changes
   */
  visibilityChange: (hidden: boolean) => void;
};

export interface PageVisibilityObserverConstructorProps {
  /**
   * timeout period in seconds.
   */
  inactiveTimeout?: number;
  onHidden?: () => void;
  onVisible?: () => void;
  onVisibilityChange?: () => void;
}

const defaultProps: PageVisibilityObserverConstructorProps = {};

export class PageVisibilityObserver extends EventEmitter<PageVisibilityEvents> {
  #inactiveTimeout?: number;
  #inactivityTimer?: ReturnType<typeof setTimeout>;
  #hidden: boolean;

  visibilityChangeHandler = () => {
    this.hidden = document.hidden;
  };

  constructor({
    inactiveTimeout,
    onHidden,
    onVisibilityChange,
    onVisible,
  } = defaultProps) {
    super();

    this.#hidden = document.hidden;
    this.#inactiveTimeout = inactiveTimeout;

    if (onHidden) {
      this.on("hidden", onHidden);
    }
    if (onVisible) {
      this.on("visible", onVisible);
    }
    if (onVisibilityChange) {
      this.on("visibilityChange", onVisibilityChange);
    }

    document.addEventListener("visibilitychange", this.visibilityChangeHandler);
  }

  clear() {
    document.removeEventListener(
      "visibilitychange",
      this.visibilityChangeHandler,
    );
  }

  private set hidden(hidden: boolean) {
    if (hidden !== this.#hidden) {
      this.#hidden = hidden;
      if (document.hidden) {
        this.emit("hidden");
        if (this.#inactiveTimeout) {
          this.#inactivityTimer = setTimeout(() => {
            this.emit("inactive-timeout");
          }, this.#inactiveTimeout);
        }
      } else {
        this.emit("visible");
        if (this.#inactivityTimer) {
          clearTimeout(this.#inactivityTimer);
          this.#inactivityTimer = undefined;
        }
      }
      this.emit("visibilityChange", hidden);
    }
  }
}
