import type { NavigateFunction } from "react-router-dom";
import { toastStore } from "../toast";
import { type DocTab, docTabHref } from "./doc-tabs-model";
import { docTabsStore } from "./doc-tabs-store";

/**
 * Opens a document in a new tab. If it is already open, its tab is activated
 * instead, a document is never open in more than one tab.
 */
export const openInNewTab = (path: string, navigate: NavigateFunction) => {
  const existing = docTabsStore.findByPath(path);
  if (existing) {
    navigate(docTabHref(existing));
  } else {
    docTabsStore.requestNewTab(path);
    navigate(path);
  }
};

export const activateTab = (tab: DocTab, navigate: NavigateFunction) =>
  navigate(docTabHref(tab));

const navigateIfActivated = (
  tab: DocTab | undefined,
  navigate: NavigateFunction,
) => {
  if (tab) {
    navigate(docTabHref(tab));
  }
};

export const closeTab = (id: string, navigate: NavigateFunction) => {
  const isLast = docTabsStore.tabs.length === 1;
  navigateIfActivated(docTabsStore.close(id), navigate);
  if (isLast) {
    navigate("/");
  }
};

export const closeOtherTabs = (id: string, navigate: NavigateFunction) =>
  navigateIfActivated(docTabsStore.closeOthers(id), navigate);

export const closeTabsToRight = (id: string, navigate: NavigateFunction) =>
  navigateIfActivated(docTabsStore.closeToRight(id), navigate);

export const closeAllTabs = (navigate: NavigateFunction) => {
  docTabsStore.closeAll();
  navigate("/");
};

export const copyTabLink = (tab: DocTab) =>
  navigator.clipboard
    ?.writeText(`${location.origin}${docTabHref(tab)}`)
    .then(() => toastStore.show({ duration: 2500, message: "Link copied" }));
