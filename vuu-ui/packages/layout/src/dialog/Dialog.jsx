import React, { useCallback, useLayoutEffect, useRef } from 'react';
import cx from 'classnames';
import { Flexbox } from '../flexbox';
import { Toolbar } from '../toolbar';
import View from '../View';
import { CloseButton } from '../action-buttons';

import './Dialog.css';

const Dialog = ({ children, className, isOpen = false, onClose }) => {
  const classRoot = 'hwDialog';
  const root = useRef(null);

  useLayoutEffect(() => {
    if (isOpen) {
      root.current.showModal();
    }
  }, [isOpen]);

  const close = useCallback(() => {
    root.current.close();
    onClose();
  }, [onClose]);

  return (
    <dialog className={cx(classRoot, className)} ref={root}>
      <Flexbox style={{ flexDirection: 'column', width: 'fit-content' }}>
        <Toolbar style={{ height: 32 }}>
          <CloseButton data-pad-left={true} onClick={close} />
        </Toolbar>
        <View style={{ flex: 1 }}>{children}</View>
      </Flexbox>
    </dialog>
  );
};

export default Dialog;
