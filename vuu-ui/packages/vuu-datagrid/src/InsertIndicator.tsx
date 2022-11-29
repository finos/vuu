import { ForwardedRef, forwardRef, HTMLAttributes } from "react";

import "./InsertIndicator.css";

const InsertIndicator = forwardRef(function InsertIndicator(
  props: HTMLAttributes<HTMLDivElement>,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  return <div {...props} className={"vuuInsertIndicator"} ref={forwardedRef} />;
});

export default InsertIndicator;
