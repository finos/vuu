import { CSSProperties, forwardRef, ForwardedRef, HTMLAttributes } from "react";
import { MeasuredSize, useMeasuredContainer } from "./useMeasuredContainer";
import { useForkRef } from "@salt-ds/core";
import cx from "classnames";

import "./MeasuredContainer.css";

export interface MeasuredContainerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * A numeric value for height will result in a fixed height. To adapt to container
   * use either a percentage height or 'auto'. Always use 'auto' when rendering
   * within a column based flex container, together with a flex value (use the
   * --vuuMeasuredContainer-flex CSS custom property))
   */
  height?: number | string;
  onResize?: (size: MeasuredSize) => void;
  width?: number | string;
}

const baseClass = "vuuMeasuredContainer";

export const MeasuredContainer = forwardRef(function MeasuredContainer(
  {
    children,
    className,
    height,
    onResize,
    style,
    width,
    ...htmlAttributes
  }: MeasuredContainerProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const { containerRef, ...containerMeasurements } = useMeasuredContainer({
    height,
    onResize,
    width,
  });

  const { cssSize, innerSize } = containerMeasurements;
  const unmeasured = innerSize === undefined;

  const getStyle = () => {
    return unmeasured
      ? ({
          "--measured-css-height": `${cssSize.height}`,
          "--measured-css-width": `${cssSize.width}`,
        } as CSSProperties)
      : ({
          ...style,
          "--measured-css-height": `${cssSize.height}`,
          "--measured-css-width": `${cssSize.width}`,
          "--measured-px-height": `${innerSize?.height}px`,
          "--measured-px-width": `${innerSize?.width}px`,
        } as CSSProperties);
  };

  const forkedRef = useForkRef(containerRef, forwardedRef);

  return unmeasured ? (
    <div
      {...htmlAttributes}
      className={cx(baseClass, `${baseClass}-ummeasured`)}
      style={getStyle()}
      ref={containerRef}
    />
  ) : (
    <div
      {...htmlAttributes}
      className={cx(baseClass, className)}
      ref={forkedRef}
      style={getStyle()}
    >
      {children}
    </div>
  );
});
