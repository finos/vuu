import { useEffect } from "react";

export interface ClickAwayHookProps {
  containerClassName: string;
  isOpen: boolean;
  onClose?: (target: string) => void;
}

export const useClickAway = ({
  containerClassName,
  isOpen,
  onClose,
}: ClickAwayHookProps) => {
  useEffect(() => {
    let clickHandler: (evt: MouseEvent) => void;
    if (isOpen) {
      clickHandler = (evt) => {
        const target = evt.target as HTMLElement;
        const container = target.closest(`.${containerClassName}`);
        if (container === null) {
          onClose?.("root");
        }
      };

      document.body.addEventListener("click", clickHandler, true);
    }

    return () => {
      if (clickHandler) {
        document.body.removeEventListener("click", clickHandler, true);
      }
    };
  }, [containerClassName, isOpen, onClose]);
};
