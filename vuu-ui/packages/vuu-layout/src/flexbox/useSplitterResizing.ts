import { getUniqueId } from "@finos/vuu-utils";
import React, { ReactElement, useCallback, useMemo, useRef } from "react";
import { Placeholder } from "../placeholder";
import { Splitter } from "./Splitter";

import {
  findSplitterAndPlaceholderPositions,
  gatherChildMeta,
  identifyResizeParties,
  PLACEHOLDER,
  SPLITTER,
} from "./flexbox-utils";
import {
  ContentMeta,
  FlexSize,
  SplitterFactory,
  SplitterHookProps,
  SplitterHookResult,
} from "./flexboxTypes";

const originalContentOnly = (meta: ContentMeta) =>
  !meta.splitter && !meta.placeholder;

export const useSplitterResizing = ({
  children: childrenProp,
  onSplitterMoved,
  style,
}: SplitterHookProps): SplitterHookResult => {
  const rootRef = useRef<HTMLDivElement>(null);
  const flexElementsRef = useRef<HTMLDivElement[]>();
  const metaRef = useRef<ContentMeta[]>();
  const contentRef = useRef<ReactElement[]>();
  const assignedKeys = useRef<string[]>([]);
  // const [, forceUpdate] = useState({});

  // const setContent = (content: ReactElement[]) => {
  //   contentRef.current = content;
  //   forceUpdate({});
  // };

  const isColumn = style?.flexDirection === "column";
  const dimension = isColumn ? "height" : "width";
  const children = useMemo(
    () =>
      Array.isArray(childrenProp)
        ? childrenProp
        : React.isValidElement(childrenProp)
          ? [childrenProp]
          : [],
    [childrenProp],
  );

  const handleDragStart = useCallback(
    (index) => {
      console.log("handleDragStart");
      const { current: contentMeta } = metaRef;
      if (contentMeta) {
        const [participants, bystanders] = identifyResizeParties(
          contentMeta,
          index,
        );
        if (participants) {
          participants.forEach((index) => {
            const el = rootRef.current?.childNodes[index] as HTMLElement;
            if (el) {
              const { size, minSize } = measureElement(el, dimension);
              contentMeta[index].currentSize = size;
              contentMeta[index].minSize = minSize;
            }
          });
          if (bystanders) {
            bystanders.forEach((index) => {
              const el = rootRef.current?.childNodes[index] as HTMLElement;
              if (el) {
                const { [dimension]: size } = el.getBoundingClientRect();
                contentMeta[index].flexBasis = size;
              }
            });
          }

          if (rootRef.current) {
            rootRef.current.classList.add("vuuSplitterResizing");
            console.log({ root: rootRef.current });
            flexElementsRef.current = Array.from(
              rootRef.current.querySelectorAll<HTMLDivElement>(":scope > div"),
            );
          }
        }
      }
    },
    [dimension],
  );

  const handleDrag = useCallback((idx, distance) => {
    console.log("handleDrag");
    const { current: flexElements = [] } = flexElementsRef;

    if (contentRef.current && metaRef.current) {
      resizeElements(flexElements, metaRef.current, distance /*, dimension*/);
      // setContent(
      //   resizeContent(
      //     contentRef.current,
      //     metaRef.current,
      //     distance,
      //     dimension,
      //   ),
      // );
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    console.log("handleDragEnd");

    const contentMeta = metaRef.current;
    if (contentMeta) {
      onSplitterMoved?.(contentMeta.filter(originalContentOnly));
      if (rootRef.current) {
        rootRef.current.classList.remove("vuuSplitterResizing");
      }
    }
    contentMeta?.forEach((meta) => {
      meta.currentSize = undefined;
      meta.flexBasis = undefined;
      meta.flexOpen = false;
    });
  }, [onSplitterMoved]);

  const createSplitter: SplitterFactory = useCallback(
    (i) => {
      return React.createElement(Splitter, {
        column: isColumn,
        index: i,
        key: `splitter-${i}`,
        onDrag: handleDrag,
        onDragEnd: handleDragEnd,
        onDragStart: handleDragStart,
      });
    },
    [handleDrag, handleDragEnd, handleDragStart, isColumn],
  );

  useMemo(() => {
    const [content, meta] = buildContent(
      children,
      dimension,
      createSplitter,
      assignedKeys.current,
    );
    metaRef.current = meta;
    contentRef.current = content;
  }, [children, createSplitter, dimension]);

  return {
    content: contentRef.current || [],
    rootRef,
  };
};

function buildContent(
  children: ReactElement[],
  dimension: "width" | "height",
  createSplitter: SplitterFactory,
  keys: string[],
): [ReactElement[], ContentMeta[]] {
  const childMeta = gatherChildMeta(children, dimension);
  const splitterAndPlaceholderPositions =
    findSplitterAndPlaceholderPositions(childMeta);
  const content = [];
  const meta: ContentMeta[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (i === 0 && splitterAndPlaceholderPositions[i] & PLACEHOLDER) {
      content.push(createPlaceholder(i));
      meta.push({ placeholder: true, shim: true });
    }
    if (child.key == null) {
      const key = keys[i] || (keys[i] = getUniqueId());
      content.push(React.cloneElement(child, { key }));
    } else {
      content.push(child);
    }
    meta.push(childMeta[i]);

    if (i > 0 && splitterAndPlaceholderPositions[i] & PLACEHOLDER) {
      content.push(createPlaceholder(i));
      meta.push({ placeholder: true });
    } else if (splitterAndPlaceholderPositions[i] & SPLITTER) {
      content.push(createSplitter(content.length));
      meta.push({ splitter: true });
    }
  }
  return [content, meta];
}

// function resizeContent(
//   content: ReactElement[],
//   contentMeta: ContentMeta[],
//   distance: number,
//   dimension: "width" | "height",
// ) {
//   const metaUpdated = updateMeta(contentMeta, distance);
//   if (!metaUpdated) {
//     return;
//   }

//   console.log(JSON.stringify(contentMeta, null, 2));

//   return content.map((child, idx) => {
//     const meta = contentMeta[idx];
//     const { currentSize, flexOpen, flexBasis } = meta;
//     const hasCurrentSize = currentSize !== undefined;
//     if (hasCurrentSize || flexOpen) {
//       const { flexBasis: actualFlexBasis } = child.props.style || {};
//       const size = hasCurrentSize ? meta.currentSize : flexBasis;
//       if (size !== actualFlexBasis) {
//         return React.cloneElement(child, {
//           style: {
//             ...child.props.style,
//             flexBasis: size,
//             [dimension]: "auto",
//           },
//         });
//       } else {
//         return child;
//       }
//     } else {
//       return child;
//     }
//   });
// }

function resizeElements(
  flexElements: HTMLDivElement[],
  contentMeta: ContentMeta[],
  distance: number,
  // dimension: "width" | "height",
) {
  const metaUpdated = updateMeta(contentMeta, distance);
  if (!metaUpdated) {
    return;
  }

  flexElements.forEach((element, idx) => {
    const meta = contentMeta[idx];
    const { currentSize, flexOpen, flexBasis, splitter } = meta;
    const hasCurrentSize = currentSize !== undefined;
    if (!splitter && (hasCurrentSize || flexOpen)) {
      // const actualFlexBasis = parseInt(element.style.flexBasis);
      const size = hasCurrentSize ? meta.currentSize : flexBasis;
      // if (size !== actualFlexBasis) {
      // console.log(`resize item  from ${actualFlexBasis} to ${currentSize}`);
      element.style.flexBasis = `${size}px`;
      // return React.cloneElement(child, {
      //   style: {
      //     ...child.props.style,
      //     flexBasis: size,
      //     [dimension]: "auto",
      //   },
      // });
      // }
    }
  });

  // });
}

//TODO detect cursor move beyond drag limit and suspend further resize until cursoe re-engages with splitter
function updateMeta(contentMeta: ContentMeta[], distance: number) {
  const resizeTargets: number[] = [];

  contentMeta.forEach((meta, idx) => {
    if (meta.currentSize !== undefined) {
      resizeTargets.push(idx);
    }
  });

  // we want the target being reduced first, this may limit the distance we can apply
  const target1 = distance < 0 ? resizeTargets[0] : resizeTargets[1];

  const { currentSize = 0, minSize = 0 } = contentMeta[target1];
  if (currentSize === minSize) {
    // size is already 0, we cannot go further
    return false;
  } else if (Math.abs(distance) > currentSize - minSize) {
    // reduce to 0
    const multiplier = distance < 0 ? -1 : 1;
    distance = Math.max(0, currentSize - minSize) * multiplier;
  }

  const leadingItem = contentMeta[resizeTargets[0]] as ContentMeta;
  const { currentSize: leadingSize = 0 } = leadingItem;
  leadingItem.currentSize = leadingSize + distance;

  const trailingItem = contentMeta[resizeTargets[1]] as ContentMeta;
  const { currentSize: trailingSize = 0 } = trailingItem;
  trailingItem.currentSize = trailingSize - distance;

  return true;
}

function createPlaceholder(index: number) {
  return React.createElement(Placeholder, {
    shim: index === 0,
    key: `placeholder-${index}`,
  });
}

function measureElement(
  el: HTMLElement,
  dimension: "width" | "height",
): FlexSize {
  const { [dimension]: size } = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const minSizeVal = style.getPropertyValue(`min-${dimension}`);
  const minSize = minSizeVal.endsWith("px") ? parseInt(minSizeVal, 10) : 0;
  return { size, minSize };
}
