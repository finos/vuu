import { LayoutJSON, registerComponent } from "@finos/vuu-utils";
import {
  createElement,
  HTMLAttributes,
  ReactElement,
  RefCallback,
  useCallback,
  useRef,
} from "react";

export type DebugGridItemProps = HTMLAttributes<HTMLDivElement>;

export const DebugGridItem = (htmlAttributes: DebugGridItemProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const setRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    ref.current = el;
  }, []);
  console.log(`%c[DebugGridItem] render`, "color:brown;font-weight:bold;");
  return <div {...htmlAttributes} className="vuuDebugGridItem" ref={setRef} />;
};

registerComponent("DebugGridItem", DebugGridItem, "view");

const DebugGridItemType = createElement(DebugGridItem).type;

DebugGridItem.toJSON = (
  element: ReactElement<DebugGridItemProps, typeof DebugGridItemType>,
) => {
  return {
    id: element.props.id,
    props: {
      style: element.props.style,
    },
    type: "DebugGridItem",
  } as LayoutJSON;
};
