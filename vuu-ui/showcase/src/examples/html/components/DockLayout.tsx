import {
  Children,
  CSSProperties,
  HTMLAttributes,
  ReactElement,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useRef,
} from "react";
import cx from "clsx";
import "./DockLayout.css";
import { ResizeStrategy } from "@vuu-ui/vuu-layout";

const classBase = "DockLayout";

const isSingleReactElement = (children: ReactNode): children is ReactElement =>
  Children.count(children) === 1;

const getGridCssAttributes = ({
  bottomPanelSize: b,
  leftPanelSize: l,
  rightPanelSize: r,
  topPanelSize: t,
}: DockedPanelSize) => {
  return {
    gridTemplateColumns: `${l}px auto ${r}px`,
    gridTemplateRows: `${t}px auto ${b}px`,
  } as CSSProperties;
};

export type DockedPanelSize = {
  bottomPanelSize?: number;
  leftPanelSize?: number;
  rightPanelSize?: number;
  topPanelSize?: number;
};

export interface DockLayoutProps
  extends DockedPanelSize,
    HTMLAttributes<HTMLDivElement> {
  onBottomPanelVisible?: () => void;
  onLeftPanelVisible?: () => void;
  onRightPanelVisible?: () => void;
  onTopPanelVisible?: () => void;
  showBottomPanel?: boolean;
  showLeftPanel?: boolean;
  showRightPanel?: boolean;
  showTopPanel?: boolean;
  children: ReactElement | ReactElement[];
  resize?: ResizeStrategy;
}

export const DockLayout = ({
  bottomPanelSize = 32,
  children,
  className,
  leftPanelSize = 160,
  resize = "responsive",
  onBottomPanelVisible,
  onLeftPanelVisible,
  onRightPanelVisible,
  onTopPanelVisible,
  rightPanelSize = 100,
  showBottomPanel,
  showLeftPanel,
  showRightPanel,
  showTopPanel,
  style,
  topPanelSize = 32,
  ...htmlAttributes
}: DockLayoutProps) => {
  const cssGridAttributes = getGridCssAttributes({
    bottomPanelSize: showBottomPanel ? bottomPanelSize : 0,
    leftPanelSize: showLeftPanel ? leftPanelSize : 0,
    rightPanelSize: showRightPanel ? rightPanelSize : 0,
    topPanelSize: showTopPanel ? topPanelSize : 0,
  });

  const deferResize = resize === "defer";
  const hasPanelVisibleListener =
    onBottomPanelVisible ||
    onLeftPanelVisible ||
    onRightPanelVisible ||
    onTopPanelVisible;
  const contentRef = useRef<HTMLDivElement>(null);
  const contentInnerRef = useRef<HTMLDivElement>(null);

  const setContentSize = useCallback((sourceRef: RefObject<HTMLElement>) => {
    if (sourceRef.current && contentInnerRef.current) {
      const { current: sourceEl } = sourceRef;
      const { current: targetEl } = contentInnerRef;
      const { height, width } = sourceEl.getBoundingClientRect();
      console.log(`set content inner size to ${width} x ${height}`);
      targetEl.style.cssText = `height: ${height}px; width: ${width}px;`;
    }
  }, []);

  useEffect(() => {
    if (contentInnerRef.current) {
      setContentSize(contentInnerRef);
    }
  }, [setContentSize]);

  const handleContentTransitionEnd = useCallback(() => {
    setContentSize(contentRef);
    showBottomPanel && onBottomPanelVisible?.();
    showLeftPanel && onLeftPanelVisible?.();
    showRightPanel && onRightPanelVisible?.();
    showTopPanel && onTopPanelVisible?.();
  }, [
    onBottomPanelVisible,
    onLeftPanelVisible,
    onRightPanelVisible,
    onTopPanelVisible,
    setContentSize,
    showBottomPanel,
    showLeftPanel,
    showRightPanel,
    showTopPanel,
  ]);

  const createWrapper = useCallback(
    (contentElement: ReactElement) => (
      <div
        className={`${classBase}-contentPanel`}
        data-dock="content"
        ref={contentRef}
      >
        <div
          className={`${classBase}-contentPanel-inner`}
          ref={contentInnerRef}
        >
          {contentElement}
        </div>
      </div>
    ),
    [],
  );

  const wrapContentElement = useCallback(
    (children: ReactElement | ReactElement[]) => {
      if (isSingleReactElement(children)) {
        return createWrapper(children);
      } else {
        let contentFound = false;
        const count = Children.count(children);
        return Children.map(children, (child, index) => {
          const isLastChild = index === count - 1;
          const { "data-dock": dockPosition } = child.props;
          if (dockPosition === "content" || (!contentFound && isLastChild)) {
            contentFound = true;
            return createWrapper(child);
          } else {
            return child;
          }
        });
      }
    },
    [createWrapper],
  );

  const childElements = deferResize ? wrapContentElement(children) : children;
  const onTransitionEnd =
    deferResize || hasPanelVisibleListener
      ? handleContentTransitionEnd
      : undefined;
  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, className)}
      onTransitionEnd={onTransitionEnd}
      style={{ ...style, ...cssGridAttributes }}
    >
      {childElements}
    </div>
  );
};
