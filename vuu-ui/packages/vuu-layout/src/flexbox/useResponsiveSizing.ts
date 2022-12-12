import {
  cloneElement,
  CSSProperties,
  isValidElement,
  ReactElement,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { getUniqueId } from "@vuu-ui/vuu-utils";
import { gatherChildMeta } from "./flexbox-utils";
import { BreakPoint } from "./flexboxTypes";

const breakPoints: BreakPoint[] = ["xs", "sm", "md", "lg", "xl"];

const DEFAULT_COLS = 12;

export const useResponsiveSizing = ({
  children: childrenProp,
  cols: colsProp,
  style,
}: {
  children: ReactElement[];
  cols?: number;
  style?: CSSProperties;
}) => {
  const rootRef = useRef(null);
  const metaRef = useRef(null);
  const contentRef = useRef<ReactElement[]>();
  const cols = colsProp ?? DEFAULT_COLS;

  const isColumn = style?.flexDirection === "column";
  const dimension = isColumn ? "height" : "width";

  const children = useMemo(
    () =>
      Array.isArray(childrenProp)
        ? childrenProp
        : isValidElement(childrenProp)
        ? [childrenProp]
        : [],
    [childrenProp]
  );

  const buildContent = useCallback(
    (children, dimension): [ReactElement[], any] => {
      const childMeta = gatherChildMeta(children, dimension, breakPoints);
      const content = [];
      const meta = [];
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const {
          style: { flex, ...rest },
        } = child.props;
        // TODO do we always need to clone ?
        // TODO emit the --col-span based on media query
        content.push(
          cloneElement(child, {
            key: getUniqueId(), // need to store these
            style: {
              ...rest,
              "--parent-col-count": cols,
            },
          })
        );
        meta.push(childMeta[i]);
      }
      return [content, meta];
    },
    [cols]
  );

  useMemo(() => {
    // console.log(`useMemo<initialCotent>`, children)
    const [content, meta] = buildContent(children, dimension);
    metaRef.current = meta;
    contentRef.current = content;
  }, [buildContent, children, dimension]);

  return {
    cols,
    content: contentRef.current,
    rootRef,
  };
};
