import { type ReactNode, useSyncExternalStore } from "react";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  action?: ToastAction;
  /** ms before the toast is dismissed, defaults to 6000 */
  duration?: number;
  id: number;
  message: ReactNode;
}

type Listener = () => void;

/** A single toast is shown at a time, a new toast replaces the current one */
class ToastStore {
  #count = 0;
  #listeners = new Set<Listener>();
  #timer: ReturnType<typeof setTimeout> | undefined;
  #toast: Toast | undefined;

  subscribe = (listener: Listener) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  getSnapshot = () => this.#toast;

  show(toast: Omit<Toast, "id">) {
    const id = ++this.#count;
    this.#set({ ...toast, id });
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => this.dismiss(id), toast.duration ?? 6000);
    return id;
  }

  /** dismisses the toast with given id, or whatever toast is showing */
  dismiss(id?: number) {
    if (this.#toast && (id === undefined || id === this.#toast.id)) {
      clearTimeout(this.#timer);
      this.#set(undefined);
    }
  }

  #set(toast: Toast | undefined) {
    this.#toast = toast;
    this.#listeners.forEach((listener) => listener());
  }
}

export const toastStore = new ToastStore();

export const useToast = () =>
  useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot);
