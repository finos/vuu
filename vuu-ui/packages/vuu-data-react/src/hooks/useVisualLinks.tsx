import type { DataSource } from "@vuu-ui/vuu-data-types";
import { useViewContext } from "@vuu-ui/vuu-layout";
import { IconButton } from "@vuu-ui/vuu-ui-controls";
import { useCallback, useEffect } from "react";

export const useVisualLinks = (dataSource: DataSource) => {
  const { dispatch } = useViewContext();

  const clearVisualLinkTarget = useCallback(() => {
    if (dataSource.visualLink) {
      dispatch?.({
        type: "broadcast-message",
        message: {
          targetId: dataSource.visualLink.parentClientVpId,
          type: "highlight-off",
        },
      });
    }
  }, [dataSource, dispatch]);

  const removeVisualLink = useCallback(() => {
    if (dataSource.visualLink) {
      dispatch?.({
        type: "broadcast-message",
        message: {
          targetId: dataSource.visualLink.parentClientVpId,
          type: "highlight-off",
        },
      });

      dataSource.visualLink = undefined;
    }
  }, [dataSource, dispatch]);

  const handleLinkRemoved = useCallback(() => {
    dispatch?.({
      type: "remove-toolbar-contribution",
      location: "post-title",
    });
  }, [dispatch]);

  const highlightVisualLinkTarget = useCallback(() => {
    if (dataSource.visualLink) {
      dispatch?.({
        type: "broadcast-message",
        message: {
          targetId: dataSource.visualLink.parentClientVpId,
          type: "highlight-on",
        },
      });
    }
  }, [dataSource, dispatch]);

  const handleLinkCreated = useCallback(() => {
    dispatch?.({
      type: "add-toolbar-contribution",
      location: "post-title",
      content: (
        <IconButton
          appearance="transparent"
          aria-label="remove-link"
          icon="link"
          onClick={removeVisualLink}
          onMouseEnter={highlightVisualLinkTarget}
          onMouseLeave={clearVisualLinkTarget}
          sentiment="neutral"
        />
      ),
    });
  }, [
    dispatch,
    removeVisualLink,
    highlightVisualLinkTarget,
    clearVisualLinkTarget,
  ]);

  useEffect(() => {
    dataSource.on("visual-link-created", handleLinkCreated);
    dataSource.on("visual-link-removed", handleLinkRemoved);
    return () => {
      dataSource.removeListener("visual-link-created", handleLinkCreated);
      dataSource.removeListener("visual-link-removed", handleLinkRemoved);
    };
  }, [dataSource, handleLinkCreated, handleLinkRemoved]);
};
