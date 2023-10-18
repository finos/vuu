import cx from "classnames";
import React, {
  createElement,
  CSSProperties,
  HTMLAttributes,
  ReactElement,
} from "react";
import ReactDOM from "react-dom";
import { ContextMenuOptions } from "../menu";
import { renderPortal } from "../portal-deprecated";

import "./popup-service.css";

let _dialogOpen = false;
const _popups: string[] = [];

export type PopupCloseCallback = (reason?: PopupCloseReason) => void;

export type ClickAwayClosePopup = {
  type: "click-away";
  mouseEvt: MouseEvent;
};

export type EscapeClosePopup = {
  type: "escape";
  event: KeyboardEvent;
};

export type MenuActionClosePopup = {
  menuId: string;
  options: ContextMenuOptions;
  type: "menu-action";
};

export type PopupCloseReason =
  | ClickAwayClosePopup
  | EscapeClosePopup
  | MenuActionClosePopup;

export const reasonIsMenuAction = (
  reason?: PopupCloseReason
): reason is MenuActionClosePopup => reason?.type === "menu-action";

export const reasonIsClickAway = (
  reason?: PopupCloseReason
): reason is ClickAwayClosePopup => reason?.type === "click-away";

function specialKeyHandler(e: KeyboardEvent) {
  if (e.key === "Esc") {
    if (_popups.length) {
      closeAllPopups();
    } else if (_dialogOpen) {
      const dialogRoot = document.body.querySelector(".vuuDialog");
      if (dialogRoot) {
        ReactDOM.unmountComponentAtNode(dialogRoot);
      }
    }
  }
}

function outsideClickHandler(e: MouseEvent) {
  if (_popups.length) {
    const popupContainers = document.body.querySelectorAll(
      ".vuuPopup,#vuu-portal-root"
    );
    for (let i = 0; i < popupContainers.length; i++) {
      if (popupContainers[i].contains(e.target as HTMLElement)) {
        return;
      }
    }
    closeAllPopups({ mouseEvt: e, type: "click-away" });
  }
}

function closeAllPopups(reason?: PopupCloseReason) {
  if (_popups.length === 1) {
    PopupService.hidePopup(reason, "anon", "all");
  } else if (_popups.length) {
    // onsole.log(`closeAllPopups`);
    const popupContainers = document.body.querySelectorAll(".vuuPopup");
    for (let i = 0; i < popupContainers.length; i++) {
      ReactDOM.unmountComponentAtNode(popupContainers[i]);
    }
    popupClosed("*");
  }
}

function dialogOpened() {
  if (_dialogOpen === false) {
    _dialogOpen = true;
    window.addEventListener("keydown", specialKeyHandler, true);
  }
}

function dialogClosed() {
  if (_dialogOpen) {
    _dialogOpen = false;
    window.removeEventListener("keydown", specialKeyHandler, true);
  }
}

function popupOpened(name: string) {
  if (_popups.indexOf(name) === -1) {
    _popups.push(name);
    //onsole.log('PopupService, popup opened ' + name + '  popups : ' + _popups);
    if (_dialogOpen === false) {
      window.addEventListener("keydown", specialKeyHandler, true);
      window.addEventListener("click", outsideClickHandler, true);
    }
  }
}

function popupClosed(name: string /*, group=null*/) {
  if (_popups.length) {
    if (name === "*") {
      _popups.length = 0;
    } else {
      const pos = _popups.indexOf(name);
      if (pos !== -1) {
        _popups.splice(pos, 1);
      }
    }
    //onsole.log('PopupService, popup closed ' + name + '  popups : ' + _popups);
    if (_popups.length === 0 && _dialogOpen === false) {
      window.removeEventListener("keydown", specialKeyHandler, true);
      window.removeEventListener("click", outsideClickHandler, true);
    }
  }
}

const PopupComponent = ({
  children,
  position,
  style,
}: HTMLAttributes<HTMLDivElement> & {
  position?: "above" | "below" | "";
  style?: CSSProperties;
}) => {
  const className = cx("hwPopup", "hwPopupContainer", position);
  return createElement("div", { className, style }, children);
};

let incrementingKey = 1;

export interface ShowPopupProps {
  depth?: number;
  /**
   * if true, focus will be invoked on first focusable element
   */
  focus?: boolean;
  name?: string;
  group?: string;
  position?: "above" | "below" | "";
  left?: number;
  right?: "auto" | number;
  top?: number;
  component: ReactElement;
  width?: number | "auto";
}

export class PopupService {
  static onClose: PopupCloseCallback | undefined;
  static showPopup({
    group = "all",
    name = "anon",
    left = 0,
    position = "",
    right = "auto",
    top = 0,
    width = "auto",
    component,
  }: ShowPopupProps) {
    if (!component) {
      throw Error(`PopupService showPopup, no component supplied`);
    }

    if (typeof component.props.onClose === "function") {
      PopupService.onClose = component.props.onClose;
    } else {
      PopupService.onClose = undefined;
    }

    popupOpened(name);

    document.addEventListener("keydown", PopupService.escapeKeyListener, true);

    let el = document.body.querySelector(".vuuPopup." + group) as HTMLElement;
    if (el === null) {
      el = document.createElement("div") as HTMLElement;
      el.className = "vuuPopup " + group;
      document.body.appendChild(el);
    }

    const style = { width };

    renderPortal(
      createElement(
        PopupComponent,
        { key: incrementingKey++, position, style },
        component
      ),
      el,
      left,
      top,
      () => {
        PopupService.keepWithinThePage(el, right);
      }
    );
  }

  static escapeKeyListener(evt: KeyboardEvent) {
    if (evt.key === "Escape") {
      PopupService.hidePopup({ type: "escape", event: evt });
    }
  }

  static hidePopup(reason?: PopupCloseReason, name = "anon", group = "all") {
    if (_popups.indexOf(name) !== -1) {
      popupClosed(name);
      const popupRoot = document.body.querySelector(`.vuuPopup.${group}`);
      if (popupRoot) {
        ReactDOM.unmountComponentAtNode(popupRoot);
      }
    }
    document.removeEventListener(
      "keydown",
      PopupService.escapeKeyListener,
      true
    );

    PopupService?.onClose?.(reason);
  }

  static keepWithinThePage(el: HTMLElement, right: number | "auto" = "auto") {
    const target = el.querySelector(".vuuPopupContainer > *") as HTMLElement;
    if (target) {
      const {
        top,
        left,
        width,
        height,
        right: currentRight,
      } = target.getBoundingClientRect();

      const w = window.innerWidth;
      const h = window.innerHeight;

      const overflowH = h - (top + height);
      if (overflowH < 0) {
        target.style.top = Math.round(top) + overflowH + "px";
      }

      const overflowW = w - (left + width);
      if (overflowW < 0) {
        target.style.left = Math.round(left) + overflowW + "px";
      }

      if (typeof right === "number" && right !== currentRight) {
        const adjustment = right - currentRight;
        target.style.left = left + adjustment + "px";
      }
    }
  }
}

export class DialogService {
  static showDialog(dialog: ReactElement) {
    const containerEl = ".vuuDialog";
    const onClose = dialog.props.onClose;

    dialogOpened();

    ReactDOM.render(
      React.cloneElement(dialog, {
        container: containerEl,
        onClose: () => {
          DialogService.closeDialog();
          if (onClose) {
            onClose();
          }
        },
      }),
      document.body.querySelector(containerEl)
    );
  }

  static closeDialog() {
    dialogClosed();
    const dialogRoot = document.body.querySelector(".vuuDialog");
    if (dialogRoot) {
      ReactDOM.unmountComponentAtNode(dialogRoot);
    }
  }
}
