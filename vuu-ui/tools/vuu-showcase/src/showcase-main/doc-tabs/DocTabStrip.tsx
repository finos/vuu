import { Button, Menu, MenuItem, MenuTrigger } from "@salt-ds/core";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { findTreeNode } from "../../shared-utils";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { ChromeMenuPanel } from "../chrome/ChromeMenu";
import {
  ContextMenu,
  type ContextMenuPosition,
  MenuSeparator,
} from "../chrome/ContextMenu";
import type { NavNodeData } from "../tree-nav/nav-tree";
import {
  addExampleToWorkspace,
  createWorkspaceFromExample,
} from "../workspace/workspace-actions";
import { workspaceIdFromPath } from "../workspace/workspace-model";
import { useWorkspaces } from "../workspace/workspace-store";
import {
  activateTab,
  closeAllTabs,
  closeOtherTabs,
  closeTab,
  closeTabsToRight,
  copyTabLink,
} from "./doc-tabs-actions";
import { type DocTab, docTabKind, fitTabs } from "./doc-tabs-model";
import { docTabsStore, useDocTabs } from "./doc-tabs-store";

import "./DocTabStrip.css";

const classBase = "ShowcaseDocTabs";
const STRIP_PADDING = 40;
const TAB_GAP = 2;
const OVERFLOW_WIDTH = 56;

export interface DocTabStripProps {
  treeSource: TreeSourceNode<NavNodeData>[];
}

/** The label of each open document, workspaces can be renamed */
const useTabLabels = (
  tabs: DocTab[],
  treeSource: TreeSourceNode<NavNodeData>[],
) => {
  const workspaces = useWorkspaces();
  return useMemo(() => {
    const labels = new Map<string, string>();
    for (const { id, path } of tabs) {
      const workspaceId = workspaceIdFromPath(path);
      labels.set(
        id,
        workspaceId
          ? (workspaces.find((ws) => ws.id === workspaceId)?.name ??
              "Workspace")
          : (findTreeNode(path, treeSource)?.label ?? path.split("/").pop()) ||
              path,
      );
    }
    return labels;
  }, [tabs, treeSource, workspaces]);
};

interface DocTabItemProps {
  active?: boolean;
  label: string;
  onClose?: () => void;
  onContextMenu?: (evt: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (evt: KeyboardEvent<HTMLElement>) => void;
  onSelect?: () => void;
  tab: DocTab;
}

const DocTabItem = ({
  active = false,
  label,
  onClose,
  onContextMenu,
  onKeyDown,
  onSelect,
  tab,
}: DocTabItemProps) => {
  const isWorkspace = docTabKind(tab.path) === "workspace";
  return (
    <div
      aria-selected={active}
      className={cx(`${classBase}-tab`, {
        [`${classBase}-tab-active`]: active,
      })}
      data-tab-id={tab.id}
      onAuxClick={(evt) => {
        // middle click closes, as in a browser
        if (evt.button === 1) {
          evt.preventDefault();
          onClose?.();
        }
      }}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
      onMouseDown={(evt) => {
        // suppress auto scroll on middle click
        if (evt.button === 1) evt.preventDefault();
      }}
      role="tab"
      tabIndex={active ? 0 : -1}
      title={label}
    >
      <span className={`${classBase}-icon`}>
        <ChromeIcon name={isWorkspace ? "layout" : "cube"} size={14} />
      </span>
      <span className={`${classBase}-label`}>{label}</span>
      <span
        aria-hidden
        className={`${classBase}-close`}
        onClick={(evt) => {
          evt.stopPropagation();
          onClose?.();
        }}
        title="Close tab"
      >
        <ChromeIcon name="close" size={12} />
      </span>
    </div>
  );
};

interface TabMenuState {
  position: ContextMenuPosition;
  tab: DocTab;
}

const TabContextMenu = ({
  label,
  menu,
  onClose,
}: {
  label: string;
  menu?: TabMenuState;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const workspaces = useWorkspaces();
  const tab = menu?.tab;
  const tabs = docTabsStore.tabs;
  const index = tab ? tabs.findIndex((t) => t.id === tab.id) : -1;
  const isExample = tab ? docTabKind(tab.path) === "example" : false;
  const targetWorkspaceId = isExample
    ? workspaceIdFromPath(docTabsStore.targetWorkspacePath() ?? "")
    : undefined;
  const targetWorkspace = workspaces.find((ws) => ws.id === targetWorkspaceId);
  return (
    <ContextMenu heading={label} onClose={onClose} position={menu?.position}>
      {tab ? (
        <>
          <MenuItem onClick={() => closeTab(tab.id, navigate)}>
            <ChromeIcon name="close" size={14} />
            Close
          </MenuItem>
          <MenuItem
            disabled={tabs.length < 2}
            onClick={() => closeOtherTabs(tab.id, navigate)}
          >
            <span className="ShowcaseMenu-iconSpacer" />
            Close other tabs
          </MenuItem>
          <MenuItem
            disabled={index === tabs.length - 1}
            onClick={() => closeTabsToRight(tab.id, navigate)}
          >
            <span className="ShowcaseMenu-iconSpacer" />
            Close tabs to the right
          </MenuItem>
          {isExample ? (
            <>
              <MenuSeparator />
              {targetWorkspace ? (
                <MenuItem
                  onClick={() =>
                    addExampleToWorkspace(
                      targetWorkspace.id,
                      { path: tab.path, title: label },
                      navigate,
                    )
                  }
                >
                  <ChromeIcon name="layout" size={14} />
                  Add to “{targetWorkspace.name}”
                </MenuItem>
              ) : null}
              <MenuItem
                onClick={() =>
                  createWorkspaceFromExample(
                    { path: tab.path, title: label },
                    navigate,
                  )
                }
              >
                <ChromeIcon name="plus" size={14} />
                New workspace from tab
              </MenuItem>
            </>
          ) : null}
          <MenuSeparator />
          <MenuItem onClick={() => activateTab(tab, navigate)}>
            <ChromeIcon name="layers" size={14} />
            Reveal in sidebar
          </MenuItem>
          <MenuItem onClick={() => copyTabLink(tab)}>
            <ChromeIcon name="link" size={14} />
            Copy link
          </MenuItem>
        </>
      ) : null}
    </ContextMenu>
  );
};

/**
 * Tabs for the documents (examples and workspaces) that are open. Shown in
 * place of the page title once more than one document is open. Tabs that do
 * not fit are listed in an overflow menu, the active tab is always visible.
 */
export const DocTabStrip = ({ treeSource }: DocTabStripProps) => {
  const navigate = useNavigate();
  const { activeId, tabs } = useDocTabs();
  const labels = useTabLabels(tabs, treeSource);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(Infinity);
  const [widths, setWidths] = useState<number[]>([]);
  const [menu, setMenu] = useState<TabMenuState>();

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container) {
      const measure = () => setAvailable(container.clientWidth - STRIP_PADDING);
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(container);
      return () => observer.disconnect();
    }
  }, []);

  // labels change the width of tabs, as well as tabs being opened and closed
  const labelKey = tabs.map(({ id }) => labels.get(id)).join("\n");
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measured when labels change
  useLayoutEffect(() => {
    const measured = measureRef.current?.children;
    if (measured) {
      setWidths(Array.from(measured, (el) => (el as HTMLElement).offsetWidth));
    }
  }, [labelKey]);

  const activeIndex = tabs.findIndex((tab) => tab.id === activeId);
  const visibleIndices =
    widths.length === tabs.length
      ? fitTabs({
          activeIndex,
          available,
          gap: TAB_GAP,
          overflowWidth: OVERFLOW_WIDTH,
          widths,
        })
      : tabs.map((_, i) => i);
  const visible = visibleIndices.map((i) => tabs[i]);
  const hidden = tabs.filter((_, i) => !visibleIndices.includes(i));

  const handleKeyDown = useCallback(
    (tab: DocTab) => (evt: KeyboardEvent<HTMLElement>) => {
      const tabEls = Array.from(
        listRef.current?.querySelectorAll<HTMLElement>("[role='tab']") ?? [],
      );
      const index = tabEls.indexOf(evt.currentTarget);
      if (evt.key === "ArrowRight" || evt.key === "ArrowLeft") {
        evt.preventDefault();
        const step = evt.key === "ArrowRight" ? 1 : -1;
        tabEls[(index + step + tabEls.length) % tabEls.length]?.focus();
      } else if (evt.key === "Enter" || evt.key === " ") {
        evt.preventDefault();
        activateTab(tab, navigate);
      } else if (evt.key === "Delete" || evt.key === "Backspace") {
        evt.preventDefault();
        closeTab(tab.id, navigate);
      }
    },
    [navigate],
  );

  return (
    <div className={classBase} ref={containerRef}>
      <div
        aria-label="Open examples and workspaces"
        className={`${classBase}-list`}
        ref={listRef}
        role="tablist"
      >
        {visible.map((tab) => (
          <DocTabItem
            active={tab.id === activeId}
            key={tab.id}
            label={labels.get(tab.id) ?? ""}
            onClose={() => closeTab(tab.id, navigate)}
            onContextMenu={(evt) => {
              evt.preventDefault();
              setMenu({ position: { x: evt.clientX, y: evt.clientY }, tab });
            }}
            onKeyDown={handleKeyDown(tab)}
            onSelect={() => activateTab(tab, navigate)}
            tab={tab}
          />
        ))}
      </div>
      {hidden.length > 0 ? (
        <Menu placement="bottom-end">
          <MenuTrigger>
            <Button
              aria-label={`${hidden.length} more tabs`}
              appearance="bordered"
              className={`${classBase}-overflow`}
            >
              +{hidden.length}
              <ChromeIcon name="chevron-down" size={13} />
            </Button>
          </MenuTrigger>
          <ChromeMenuPanel heading="Hidden tabs">
            {hidden.map((tab) => (
              <MenuItem key={tab.id} onClick={() => activateTab(tab, navigate)}>
                <ChromeIcon
                  name={
                    docTabKind(tab.path) === "workspace" ? "layout" : "cube"
                  }
                  size={14}
                />
                {labels.get(tab.id)}
              </MenuItem>
            ))}
            <MenuSeparator />
            <MenuItem onClick={() => closeAllTabs(navigate)}>
              <ChromeIcon name="close" size={14} />
              Close all tabs
            </MenuItem>
          </ChromeMenuPanel>
        </Menu>
      ) : null}
      <div aria-hidden className={`${classBase}-measure`} ref={measureRef}>
        {tabs.map((tab) => (
          <DocTabItem
            active={tab.id === activeId}
            key={tab.id}
            label={labels.get(tab.id) ?? ""}
            tab={tab}
          />
        ))}
      </div>
      <TabContextMenu
        label={menu ? (labels.get(menu.tab.id) ?? "") : ""}
        menu={menu}
        onClose={() => setMenu(undefined)}
      />
    </div>
  );
};
