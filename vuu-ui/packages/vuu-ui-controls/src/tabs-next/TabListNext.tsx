import { capitalize, makePrefixer, useForkRef } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { clsx } from "clsx";
import {
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
} from "react";

import tablistNextCss from "./TabListNext.css";
import draggableCss from "../drag-drop/Draggable.css";
import { TabOverflowList } from "./TabOverflowList";
import { useTabsNext } from "./TabsNextContext";
import { useOverflow } from "./hooks/useOverflow";
import { useDragDrop } from "./drag-drop/useDragDrop";
import { DropHandler } from "./hooks/dragDropTypes";

const withBaseName = makePrefixer("saltTabListNext");

export interface TabListNextProps
  extends Omit<ComponentPropsWithoutRef<"div">, "onChange"> {
  /**
   * Styling active color variant. Defaults to "primary".
   */
  activeColor?: "primary" | "secondary" | "tertiary";
  /**
   * when true Tabs may be re-arranged by dragging individual Tabs to new position within Tabstrip.
   */
  allowDragDrop?: boolean;

  /**
   * The appearance of the tabs. Defaults to "bordered".
   */
  appearance?: "bordered" | "transparent";

  /**
   * Called when a draggable Tab has been dropped
   */
  onMoveTab?: (fromIndex: number, toIndex: number) => void;
}

export const TabListNext = forwardRef<HTMLDivElement, TabListNextProps>(
  function TabstripNext(props, ref) {
    const {
      allowDragDrop,
      appearance = "bordered",
      activeColor = "primary",
      children,
      className,
      onKeyDown,
      onMoveTab,
      ...rest
    } = props;
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "salt-tablist-next",
      css: tablistNextCss,
      window: targetWindow,
    });
    useComponentCssInjection({
      testId: "salt-draggable",
      css: draggableCss,
      window: targetWindow,
    });

    console.log(`TabsListNext render`);

    const {
      selected,
      getNext,
      getPrevious,
      getFirst,
      getLast,
      items,
      activeTab,
      menuOpen,
      setMenuOpen,
      returnFocus,
    } = useTabsNext();

    const tabstripRef = useRef<HTMLDivElement>(null);
    const handleRef = useForkRef(tabstripRef, ref);
    const overflowButtonRef = useRef<HTMLButtonElement>(null);

    const [visible, hidden, isMeasuring] = useOverflow({
      container: tabstripRef,
      tabs: items,
      children,
      selected,
      overflowButton: overflowButtonRef,
    });

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);

      const actionMap = {
        ArrowRight: getNext,
        ArrowLeft: getPrevious,
        Home: getFirst,
        End: getLast,
        ArrowUp: menuOpen ? getPrevious : undefined,
        ArrowDown: menuOpen ? getNext : undefined,
      };

      const action = actionMap[event.key as keyof typeof actionMap];

      if (action) {
        event.preventDefault();
        const activeTabId = activeTab.current?.id;
        if (!activeTabId) return;
        const nextItem = action(activeTabId);
        if (nextItem) {
          nextItem.element?.scrollIntoView({
            block: "nearest",
            inline: "nearest",
          });
          nextItem.element?.focus({ preventScroll: true });
        }
      }
    };

    const handleDrop = useCallback<DropHandler>(
      ({ fromIndex, toIndex }) => {
        onMoveTab?.(fromIndex, toIndex);
      },
      [onMoveTab],
    );

    const dragProps = useDragDrop({ onDrop: handleDrop });

    useLayoutEffect(() => {
      if (!returnFocus.current || visible.length < 1 || selected === undefined)
        return;

      const itemToFocus = items.find((i) => i.value === returnFocus.current);
      itemToFocus?.element?.focus({ preventScroll: true });

      requestAnimationFrame(() => {
        if (targetWindow?.document?.activeElement === itemToFocus?.element) {
          returnFocus.current = undefined;
        }
      });
    }, [visible, returnFocus, targetWindow, items, selected]);

    return (
      <div
        {...dragProps}
        role="tablist"
        className={clsx(
          withBaseName(),
          withBaseName(appearance),
          withBaseName("horizontal"),
          withBaseName(`activeColor${capitalize(activeColor)}`),
          className,
        )}
        data-ismeasuring={isMeasuring ? true : undefined}
        ref={handleRef}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        {visible}
        <TabOverflowList
          isMeasuring={isMeasuring}
          buttonRef={overflowButtonRef}
          tabstripRef={tabstripRef}
          open={menuOpen}
          setOpen={setMenuOpen}
        >
          {hidden}
        </TabOverflowList>
      </div>
    );
  },
);
