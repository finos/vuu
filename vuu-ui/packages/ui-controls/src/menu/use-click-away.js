import { useEffect } from 'react';

export const useClickAway = ({ containerClassName, isOpen, onClose }) => {
  useEffect(() => {
    const clickHandler = isOpen
      ? (evt) => {
          const container = evt.target.closest(`.${containerClassName}`);
          if (container === null) {
            onClose('root');
          }
        }
      : null;

    document.body.addEventListener('click', clickHandler, true);

    return () => {
      if (clickHandler) {
        document.body.removeEventListener('click', clickHandler, true);
      }
    };
  }, [containerClassName, isOpen, onClose]);
};
