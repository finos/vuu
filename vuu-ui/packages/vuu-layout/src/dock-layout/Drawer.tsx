import { Button, useControlled } from "@salt-ds/core";
import cx from "classnames";
import { CSSProperties, HTMLAttributes, useCallback } from "react";

import "./Drawer.css";

const classBase = "vuuDrawer";

const sizeAttribute = (value: string | number) => {
  return typeof value === "string" ? value : value + "px";
};

const getStyle = (
  styleProp?: CSSProperties,
  sizeOpen?: number,
  sizeClosed?: number
) => {
  const hasSizeOpen = sizeOpen !== undefined;
  const hasSizeClosed = sizeClosed !== undefined;

  if (!styleProp && !hasSizeClosed && !hasSizeOpen) {
    return undefined;
  }

  if (!hasSizeClosed && !hasSizeOpen) {
    return styleProp;
  }

  return {
    ...styleProp,
    "--drawer-size": hasSizeOpen ? sizeAttribute(sizeOpen) : undefined,
    "--drawer-peek-size": hasSizeClosed ? sizeAttribute(sizeClosed) : undefined,
  };
};

export interface DrawerProps extends HTMLAttributes<HTMLDivElement> {
  clickToOpen?: boolean;
  defaultOpen?: boolean;
  inline?: boolean;
  open?: boolean;
  peekaboo?: boolean;
  position?: "left" | "right" | "top" | "bottom";
  sizeOpen?: number;
  sizeClosed?: number;
  toggleButton?: "start" | "end";
}
const Drawer = ({
  children,
  className: classNameProp,
  clickToOpen,
  defaultOpen,
  sizeOpen,
  sizeClosed,
  style: styleProp,
  open: openProp,
  position = "left",
  inline,
  onClick,
  peekaboo = false,
  toggleButton,
  ...props
}: DrawerProps) => {
  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen ?? false,
    name: "Drawer",
    state: "open",
  });

  console.log(`Drawer sizeOpen ${sizeOpen} sizeClosed ${sizeClosed}`);

  const className = cx(classBase, classNameProp, `${classBase}-${position}`, {
    [`${classBase}-open`]: open,
    [`${classBase}-inline`]: inline,
    [`${classBase}-over`]: !inline,
    [`${classBase}-peekaboo`]: peekaboo,
  });

  const toggleDrawer = useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  const style = getStyle(styleProp, sizeOpen, sizeClosed);

  const handleClick = clickToOpen ? toggleDrawer : onClick;

  const renderToggleButton = () => (
    <div className={cx("vuuToggleButton-container")}>
      {open ? (
        <Button
          aria-label="close"
          onClick={toggleDrawer}
          data-icon="close"
          variant="secondary"
        />
      ) : (
        <Button
          aria-label="open"
          onClick={toggleDrawer}
          data-icon="close"
          variant="secondary"
        />
      )}
    </div>
  );

  return (
    <div {...props} className={className} onClick={handleClick} style={style}>
      {toggleButton == "start" ? renderToggleButton() : null}
      <div className={`${classBase}-liner`}>
        <div className={`${classBase}-content`}>{children}</div>
      </div>
      {toggleButton == "end" ? renderToggleButton() : null}
    </div>
  );
};
Drawer.displayName = "Drawer";

export default Drawer;
