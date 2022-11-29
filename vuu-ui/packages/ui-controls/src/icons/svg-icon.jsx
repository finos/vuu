import cx from "classnames";

import "./Icon.css";

export const neverRerender = () => true;

const SvgIcon = ({ size = 18, svgPath, className, ...props }) => {
  return (
    <span className={cx(className, "hwIcon")} {...props}>
      <svg height="100%" viewBox={`0 0 ${size} ${size}`} width="100%">
        {svgPath}
      </svg>
    </span>
  );
};

export default SvgIcon;
