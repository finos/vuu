import {
  DataSourceMenusMessage,
  DataSourceVisualLinkCreatedMessage,
  DataSourceVisualLinkRemovedMessage,
  DataSourceVisualLinksMessage,
  VuuFeatureMessage,
} from "@vuu-ui/vuu-data-types";
import { GridAction } from "@vuu-ui/vuu-table-types";

export const isVisualLinksAction = (
  action: GridAction,
): action is DataSourceVisualLinksMessage => action.type === "vuu-links";

export const isVisualLinkCreatedAction = (
  action: GridAction,
): action is DataSourceVisualLinkCreatedMessage =>
  action.type === "vuu-link-created";

export const isVisualLinkRemovedAction = (
  action: GridAction,
): action is DataSourceVisualLinkRemovedMessage =>
  action.type === "vuu-link-removed";

export const isViewportMenusAction = (
  action: GridAction,
): action is DataSourceMenusMessage => action.type === "vuu-menu";

export const isVuuFeatureAction = (
  action: GridAction,
): action is VuuFeatureMessage =>
  isViewportMenusAction(action) || isVisualLinksAction(action);
