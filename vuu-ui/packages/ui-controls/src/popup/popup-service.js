import React, { createElement, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { renderPortal } from "../portal";
import cx from "classnames";

import "./popup-service.css";
window.popupReact = React;

let _dialogOpen = false;
const _popups = [];

function specialKeyHandler(e) {
  if (e.keyCode === 27 /* ESC */) {
    if (_popups.length) {
      closeAllPopups();
    } else if (_dialogOpen) {
      ReactDOM.unmountComponentAtNode(
        document.body.querySelector(".hwReactDialog")
      );
    }
  }
}

function outsideClickHandler(e) {
  if (_popups.length) {
    // onsole.log(`Popup.outsideClickHandler`);
    const popupContainers = document.body.querySelectorAll(".hwReactPopup");
    for (let i = 0; i < popupContainers.length; i++) {
      if (popupContainers[i].contains(e.target)) {
        return;
      }
    }
    closeAllPopups();
  }
}

function closeAllPopups() {
  if (_popups.length) {
    // onsole.log(`closeAllPopups`);
    const popupContainers = document.body.querySelectorAll(".hwReactPopup");
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

function popupOpened(name /*, group*/) {
  if (_popups.indexOf(name) === -1) {
    _popups.push(name);
    //onsole.log('PopupService, popup opened ' + name + '  popups : ' + _popups);
    if (_dialogOpen === false) {
      window.addEventListener("keydown", specialKeyHandler, true);
      window.addEventListener("click", outsideClickHandler, true);
    }
  }
}

function popupClosed(name /*, group=null*/) {
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

const PopupComponent = ({ children, position, style }) => {
  const className = cx("hwPopup", "hwPopupContainer", position);
  return createElement("div", { className, style }, children);
};

let incrementingKey = 1;

export class PopupService {
  static showPopup({
    name = "anon",
    group = "all",
    position = "",
    left = 0,
    right = "auto",
    top = 0,
    width = "auto",
    component,
  }) {
    if (!component) {
      throw Error(`PopupService showPopup, no component supplied`);
    }
    popupOpened(name, group);
    let el = document.body.querySelector(".hwReactPopup." + group);
    if (el === null) {
      el = document.createElement("div");
      el.className = "hwReactPopup " + group;
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

  static hidePopup(name = "anon", group = "all") {
    //onsole.log('PopupService.hidePopup name=' + name + ', group=' + group)

    if (_popups.indexOf(name) !== -1) {
      popupClosed(name, group);
      ReactDOM.unmountComponentAtNode(
        document.body.querySelector(`.hwReactPopup.${group}`)
      );
    }
  }

  static keepWithinThePage(el, right = "auto") {
    const target = el.querySelector(".hwPopupContainer > *");
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
        target.style.top = parseInt(top, 10) + overflowH + "px";
      }

      const overflowW = w - (left + width);
      if (overflowW < 0) {
        target.style.left = parseInt(left, 10) + overflowW + "px";
      }

      if (typeof right === "number" && right !== currentRight) {
        const adjustment = right - currentRight;
        target.style.left = left + adjustment + "px";
      }
    }
  }
}

export class DialogService {
  static showDialog(dialog) {
    const containerEl = ".hwReactDialog";
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
    ReactDOM.unmountComponentAtNode(
      document.body.querySelector(".hwReactDialog")
    );
  }
}

export const Popup = (props) => {
  const pendingTask = useRef(null);
  const ref = useRef(null);

  const show = (props, boundingClientRect) => {
    const { name, group, depth, width } = props;
    let left, top;

    if (pendingTask.current) {
      clearTimeout(pendingTask.current);
      pendingTask.current = null;
    }

    if (props.close === true) {
      PopupService.hidePopup(name, group);
    } else {
      const { position, children: component } = props;
      const {
        left: targetLeft,
        top: targetTop,
        width: clientWidth,
        bottom: targetBottom,
      } = boundingClientRect;

      if (position === "below") {
        left = targetLeft;
        top = targetBottom;
      } else if (position === "above") {
        left = targetLeft;
        top = targetTop;
      }

      pendingTask.current = setTimeout(() => {
        PopupService.showPopup({
          name,
          group,
          depth,
          position,
          left,
          top,
          width: width || clientWidth,
          component,
        });
      }, 10);
    }
  };

  useEffect(() => {
    if (ref.current) {
      const el = ref.current.parentElement;
      const boundingClientRect = el.getBoundingClientRect();
      //onsole.log(`%cPopup.componentDidMount about to call show`,'color:green');
      show(props, boundingClientRect);
    }

    return () => {
      PopupService.hidePopup(props.name, props.group);
    };
  }, [props]);

  return React.createElement("div", { className: "popup-proxy", ref });

  // componentWillReceiveProps(nextProps) {

  //     const domNode = ReactDOM.findDOMNode(this);
  //     if (domNode) {
  //         const el = domNode.parentElement;
  //         const boundingClientRect = el.getBoundingClientRect();
  //         //onsole.log(`%cPopup.componentWillReceiveProps about to call show`,'color:green');
  //         this.show(nextProps, boundingClientRect);
  //     }
  // }
};
