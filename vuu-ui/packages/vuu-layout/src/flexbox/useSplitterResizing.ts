import React, {
  ReactElement,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { getUniqueId } from "@vuu-ui/vuu-utils";
import { Splitter } from "./Splitter";
import { Placeholder } from "../placeholder";

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
  const rootRef = useRef<HTMLDivElement>();
  const metaRef = useRef<ContentMeta[]>();
  const contentRef = useRef<ReactElement[]>();
  const assignedKeys = useRef([]);
  const [, forceUpdate] = useState({});

  const setContent = (content: ReactElement[]) => {
    contentRef.current = content;
    forceUpdate({});
  };

  const isColumn = style?.flexDirection === "column";
  const dimension = isColumn ? "height" : "width";
  const children = useMemo(
    () =>
      Array.isArray(childrenProp)
        ? childrenProp
        : React.isValidElement(childrenProp)
        ? [childrenProp]
        : [],
    [childrenProp]
  );

  const handleDragStart = useCallback(
    (index) => {
      const { current: contentMeta } = metaRef;
      if (contentMeta) {
        const [participants, bystanders] = identifyResizeParties(
          contentMeta,
          index
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
        }
      }
    },
    [dimension]
  );

  const handleDrag = useCallback(
    (idx, distance) => {
      if (contentRef.current && metaRef.current) {
        setContent(
          resizeContent(
            contentRef.current,
            metaRef.current,
            distance,
            dimension
          )
        );
      }
    },
    [dimension]
  );

  const handleDragEnd = useCallback(() => {
    const contentMeta = metaRef.current;
    if (contentMeta) {
      onSplitterMoved?.(contentMeta.filter(originalContentOnly));
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
    [handleDrag, handleDragEnd, handleDragStart, isColumn]
  );

  useMemo(() => {
    // This will always fire when Flexbox has rendered, but nor during splitter resize
    const [content, meta] = buildContent(
      children,
      dimension,
      createSplitter,
      assignedKeys.current
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
  keys: any[]
): [any[], ContentMeta[]] {
  const childMeta = gatherChildMeta(children, dimension);
  const splitterAndPlaceholderPositions =
    findSplitterAndPlaceholderPositions(childMeta);
  const content = [];
  const meta: ContentMeta[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (i === 0 && splitterAndPlaceholderPositions[i] & PLACEHOLDER) {
      //TODO need to assign an id to placeholder
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

function resizeContent(
  content: ReactElement[],
  contentMeta: ContentMeta[],
  distance: number,
  dimension: "width" | "height"
) {
  const metaUpdated = updateMeta(contentMeta, distance);
  if (!metaUpdated) {
    return content;
  }

  return content.map((child, idx) => {
    const meta = contentMeta[idx];
    let { currentSize, flexOpen, flexBasis } = meta;
    const hasCurrentSize = currentSize !== undefined;
    if (hasCurrentSize || flexOpen) {
      const { flexBasis: actualFlexBasis } = child.props.style || {};
      const size = hasCurrentSize ? meta.currentSize : flexBasis;
      if (size !== actualFlexBasis) {
        return React.cloneElement(child, {
          style: {
            ...child.props.style,
            flexBasis: size,
            [dimension]: "auto",
          },
        });
      } else {
        return child;
      }
    } else {
      return child;
    }
  });
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
  let target1 = distance < 0 ? resizeTargets[0] : resizeTargets[1];

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
  } as any);
}

function measureElement(
  el: HTMLElement,
  dimension: "width" | "height"
): FlexSize {
  const { [dimension]: size } = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const minSizeVal = style.getPropertyValue(`min-${dimension}`);
  const minSize = minSizeVal.endsWith("px") ? parseInt(minSizeVal, 10) : 0;
  return { size, minSize };
}
