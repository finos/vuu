import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import { Portal } from '@vuu-ui/theme';
import { useForkRef } from '../utils/use-fork-ref';

import './dropdown.css';

const classBase = 'hwDropdown';

const listenforClickAway = (listen, handler) => {
  if (listen) {
    document.body.addEventListener('click', handler, true);
  } else {
    document.body.removeEventListener('click', handler, true);
  }
};

const useDropdownChildren = (children) => {
  if (React.Children.count(children) === 1) {
    return [children];
  }
  let mainChild,
    header = null,
    footer = null;
  React.Children.forEach(children, (child) => {
    if (child !== null) {
      if (child.props['data-header']) {
        header = child;
      } else if (child.props['data-footer']) {
        footer = child;
      } else if (mainChild !== undefined) {
        throw new Error(
          `Dropdown can only contain a single child dropdown element. Header and Footer must use 'data-header', 'data-footer data attributes'`
        );
      } else {
        mainChild = child;
      }
    }
  });
  return [mainChild, header, footer];
};

export const Dropdown = forwardRef(function Dropdown(
  {
    align = 'bottom-left',
    autofocus = false,
    children,
    className,
    anchorEl,
    onCancel,
    onCommit,
    open,
    listHeight,
    style,
    width: widthProp = 'anchor'
  },
  ref
) {
  const [child, dropdownHeader, dropdownFooter] = useDropdownChildren(children);

  const contentRef = useRef(null);
  const setContentRef = useCallback(
    (contentEl) => {
      contentRef.current = contentEl;
      if (autofocus && contentEl) {
        contentEl.focus();
      }
    },
    [autofocus]
  );
  const forkedContentRef = useForkRef(setContentRef, child.ref);

  // if (env.isElectron){
  //   const {position: {top,left,width,height}, focusOnOpen=false, componentName, children: {props: childProps}} = props;
  //   const url = getUrlForComponent(componentName);
  //   const modalProps = Object.keys(childProps).reduce((o, propertyName) => {
  //     if (typeof propertyname === 'function'){
  //       // if we really needed to, we could convert callbacks to message-based api
  //       // so far, we don't need it
  //     } else {
  //       o[propertyName] = childProps[propertyName]
  //     }
  //     return o;
  //   }, {})

  //   window.openModal(url, {
  //     position: {
  //       top: top+height,
  //       left,
  //       width,
  //       height: 230
  //     },
  //     focusOnOpen,
  //     props: modalProps
  //   })

  //   this.handlePopupMessage = this.handlePopupMessage.bind(this);

  //   window.ipcRenderer.send('modal.register','modal.calendar');
  //   window.ipcRenderer.on('modal.calendar', this.handlePopupMessage)

  // }

  const rootRef = useRef(null);
  const forkedRootRef = useForkRef(ref, rootRef);

  const [position, setPosition] = useState(null);

  const handleClickAway = useCallback(
    (evt) => {
      const { target } = evt;
      const el = rootRef.current;
      const maybeAway = !equalsOrContains(el, target);
      if (maybeAway) {
        const definatelyAway = !equalsOrContains(anchorEl, target);
        if (definatelyAway) {
          console.log(` ... ClickAway`);
          // dropdown wiill be clodes. so useEffect unload will take care
          // listenforClickAway(false);
          // onClose ?
          if (onCancel) {
            onCancel();
          }
        }
      }
    },
    [anchorEl, onCancel]
  );

  useEffect(() => {
    if (open) {
      listenforClickAway(true, handleClickAway);
      // if (autofocus){
      //   console.log(`we want toautoficus on open`)
      //   if (contentRef.current !== 'content'){
      //     contentRef.current.focus();
      //   }
      // }
    } else {
      listenforClickAway(false, handleClickAway);
    }
    return () => open && listenforClickAway(false, handleClickAway);
  }, [autofocus, handleClickAway, open]);

  useEffect(() => {
    if (anchorEl) {
      const { top, left, right, width, height } = anchorEl.getBoundingClientRect();
      setPosition({ top, left, right, width, height });
    }
  }, [anchorEl]);

  // componentWillUnmount(){
  //   console.log(`Dropdown. componentWillUnmount`)
  //   if (env.isElectron){
  //     console.log(`about to remove commit listener`)
  //     window.ipcRenderer.removeListener('modal.calendar', this.handlePopupMessage)
  //     window.ipcRenderer.send('modal.unregister','modal.calendar');
  //   }
  // }

  // componentDidUpdate(prevProps){
  //   if (env.isElectron){
  //     const {values} = this.props.children.props;
  //     const prevValues = prevProps.children.props.values;
  //     if (values !== prevValues){
  //       window.ipcRenderer.send('modal.window', {
  //         type: 'props',
  //         props: {
  //           values
  //         }
  //       });
  //     }
  //   }
  // }

  // handlePopupMessage(evt, arg){
  //   if (arg.type === 'commit'){
  //     this.props.onCommit(arg.value);
  //   } else if (arg.type === 'cancel'){
  //     this.props.onCancel();
  //   }
  // }

  // focus(){
  //   if (env.isElectron){
  //     window.ipcRenderer.send('modal.window', {type: 'focus'});
  //   } else {
  //     console.log(`dropdown focus`)
  //     this.childComponent.current.focus();
  //   }
  // }

  // if (env.isElectron){
  //   return null
  // } else{
  if (position === null || !open) {
    return null;
  }
  let { top, left, right, width: anchorWidth, height } = position;
  const width = widthProp === undefined || widthProp === 'anchor' ? anchorWidth : widthProp;

  //TODO if align is to right and we don't have a width or width is auto
  // we will have to measure after render to reposition accurately

  // This assumes width is < min-width
  if (align.endsWith('right') && typeof widthProp === 'number') {
    left = right - widthProp;
  }

  return (
    <Portal x={left} y={top + height}>
      <div
        ref={forkedRootRef}
        className={cx(classBase, className)}
        style={{ ...style, width, height: listHeight }}>
        {dropdownHeader}
        {React.cloneElement(child, {
          ref: forkedContentRef,
          onCommit,
          onCancel
        })}
        {dropdownFooter}
      </div>
    </Portal>
  );
});

const equalsOrContains = (el, targetEl) => el && (el === targetEl || el.contains(targetEl));
